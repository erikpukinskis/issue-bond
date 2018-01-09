var library = require("module-library")(require)


module.exports = library.export(
  "issue-bond",
  ["identifiable"],
  function(identifiable) {

    var outcomes = {}
    var issuers = {}
    var bondStatus = {}

    function issueBond(id, outcome, issuerName) {

      if (typeof id != "string") {
        id = identifiable.assignId(bondStatus)
      } else if (id.match(/[^a-z0-9-]/)) {
        throw new Error("Bond id can only have numbers, letters, and dashes")
      }

      bondStatus[id] = "available"
      outcomes[id] = outcome
      issuers[id] = issuerName

      return id
    }

    var investors = {}
    var portfolios = {}

    function registerInvestor(investorId, name, phoneNumber) {

      investorId = identifiable.assignId(investors, investorId)
      investors[investorId] = {name: name, phoneNumber: phoneNumber}
      return investorId
    }

    var orders = {}
    var orderStatus = {}
    var shareAsset = {}
    var shareValue = {}
    var quotes = {}
    var shareOwner = {}

    function orderShares(shareId, bondId, investorId, faceValue, quote) {

      if (!investors[investorId]) {
        throw new Error("issueBond.orderShares third parameter should be an investor id. Something's up.")
      }

      // if (bondStatus[bondId] != "available") {
      //   throw new Error("Bond "+bondId+" is not for sale")
      // }

      shareId = identifiable.assignId(orderStatus, shareId)
      orderStatus[shareId] = "pending"

      var portfolio = portfolios[investorId]

      if (!portfolio) {
        portfolio = portfolios[investorId] = {}
      }

      portfolio[bondId] = shareId
      shareAsset[shareId] = bondId
      bondStatus[bondId] = "pending"
      shareValue[shareId] = parseMoney(faceValue)
      quotes[shareId] = parseMoney(quote)
      shareOwner[shareId] = investorId

      return shareId
    }

    function cancelOrder(shareId) {
      var currentStatus = orderStatus[shareId]
      var bondId = shareAsset[shareId]

      if (currentStatus == "paid") {
        throw new Error("Order "+shareId+" is already paid. Can't cancel.")
      } else if (currentStatus == "canceled") {
        throw new Error("Can't cancel "+shareId+" because it's already canceled")
      }

      orderStatus[shareId] = "canceled"
      bondStatus[bondId] = "available"
    }

    var activeBonds = []

    function markPaid(shareId, metadata) {

      var bondId = shareAsset[shareId]

      if (orderStatus[shareId] == "paid") {
        throw new Error("Order is already paid")
      } else if (bondStatus[bondId] == "sold") {
        throw new Error("Bond is already sold")
      } else if (orderStatus[shareId] == "canceled") {
        throw new Error("Order was canceled")
      }

      bondStatus[bondId] = "sold"
      activeBonds.push(bondId)
      orderStatus[shareId] = "paid"
    }

    function eachActiveBond(callback) {
      activeBonds.forEach(callback)
    }

    function isIssued(bondId) {
      var status = bondStatus[bondId]
      return status != "available"
    }

    function matureBond(bondId) {
      throw new Error("impl")
    }

    var invoices = {}
    var invoicesByBondDay = {}

    function addInvoice(invoiceId, bondId, description, cents, day) {

      if (!invoiceId) {
        invoiceId = identifiable.assignId(invoices)
      }

      var bondDay = bondId+"+"+day

      var invoice = {
        invoiceId: invoiceId,
        status: "issued",
        bondId: bondId,
        description: description,
        amount: cents,
        day: day,
      }

      invoices[invoiceId] = invoice

      identifiable.list.add(invoicesByBondDay, bondDay, invoiceId)

      return invoiceId
    }

    var lineItems = {}
    var lineItemCosts = {}

    function lineItem(bondId, invoiceId, description, cost) {

      identifiable.list.add(lineItems, bondId+invoiceId, description)

      identifiable.list.add(lineItemCosts, bondId+invoiceId, cost)
    }

      // throw new Error("function("+Array.prototype.map.call(arguments, JSON.stringify).join(", ")+") { ... } should be defined")

    function settleUp(bondId, invoiceId, amount, fees) {

    }

    function revenue(bondId, description, proceeds) {

    }

    function mature(bondId, quoteId, maturityId, amount) {

    }

    function dailySummary(bondId, day) {
      var bondDay = bondId+"+"+day

      return {
        completedTasks: identifiable.list.map(bondDay, taskIds, getTaskText),
        invoices: identifiable.list.map(bondDay, invoices, toInvoice)
      }
    }

    function toInvoice(id) {
      return invoices[id]
    }

    // Above $1,000,000 total sales we have to file this? https://www.sec.gov/about/forms/forms-1.pdf

    var tasks = {}
    var contiguousProgress = {}
    var completedCount = {}
    var taskIsCompleted = {}

    function addTasks(bondId, additionalTasks) {

      if (isIssued(bondId)) {
        throw new Error("Bond "+bondId+" is already issued. Can't add more tasks.")
      }

      var list = tasks[bondId]

      if (list) {
        tasks[bondId] = list.concat(additionalTasks)
      } else {
        tasks[bondId] = additionalTasks
      }
    }

    var completedTasksByBondDay = {}

    function markFinished(taskId) {
      var bondId = bondForTask(taskId)
      var index = indexInBond(taskId)

      var previouslyCompleted = completedCount[bondId] || 0
      var lastContiguous = contiguousProgress[bondId] || 0

      if (lastContiguous == index) {
        contiguousProgress[bondId] = lastContiguous + 1
      }

      var completed = completedCount[bondId]

      completedCount[bondId] = previouslyCompleted + 1

      taskIsCompleted[taskId] = true

      if (!tasks[bondId]) {
        throw new Error("Bond "+bondId+" has no tasks?")
      }

      var day = localDay(new Date())
      var bondDay = bondId+"+"+day

      identifiable.list.add(completedTasksByBondDay, bondDay, taskId)

      if (completedCount[bondId] == tasks[bondId].length) {
        matureBond(bondId)
      }
    }

    function eachTask(bondId, callback) {
      for(var i=0; i<tasks[bondId].length; i++) {
        callback(tasks[bondId][i])
      }
    }

    function nextTaskId(bondId) {
      var index = contiguousProgress[bondId] || 0
      return taskId(bondId, index)
    }

    function getTaskText(taskId) {
      var bondId = bondForTask(taskId)
      var i = indexInBond(taskId)
      return tasks[bondId][i]
    }

    function getCompletedCount(bondId) {
      return completedCount[bondId] || 0
    }

    function getTaskCount(bondId) {
      return tasks[bondId].length
    }

    function taskId(bondId, i) {
      return bondId+"_t"+i
    }

    function indexInBond(taskId) {
      return parseInt(taskId.split("_t")[1])
    }

    function bondForTask(taskId) {
      return taskId.split("_t")[0]
    }

    var expenses = {}
    var expenseTotals = {}

    function addExpense(bondId, description, cost) {

      var forThisBond = expenses[bondId]

      if (!expenseTotals[bondId]) {
        expenseTotals[bondId] = 0
      }

      if (typeof forThisBond == "undefined") {
        forThisBond = expenses[bondId] = {}
      }

      var subtotal = parseMoney(cost)

      expenseTotals[bondId] += subtotal

      if (typeof forThisBond[description] != "undefined") {
        throw new Error("Already set that expense")
      }

      forThisBond[description] = subtotal
    }

    function addExpenses(bondId, totalsByDescription) {
      if (Array.isArray(
        totalsByDescription)) { 
        console.log("Expense lists need to be hashes of expense: price")
        return
      }

      for(var description in totalsByDescription) {

        var subtotal = parseMoney(totalsByDescription[description])

        addExpense(bondId, description, subtotal)
      }
    }

    function eachExpense(bondId, callback) {

      var forThisBond = expenses[bondId]

      for(var description in forThisBond) {
        var total = forThisBond[description]
        callback(description, total)
      }
    }

    function calculateFinancials(bondId) {
      var financials = {
        totalExpenses: expenseTotals[bondId],
        faceValue: roundToTen(expenseTotals[bondId]*1.1),
      }

      financials.profit = financials.faceValue - financials.totalExpenses

      return financials
    }

    function roundToTen(cents) {
      var tens = Math.ceil(cents / 1000)
      return tens*1000
    }

    function parseMoney(string) {
      if (Number.isInteger(string)) {
        var cents = string
        return cents
      } else if (typeof string != "string") {
        throw new Error("Expected "+string+" to be a string representing money")
      }
      
      var trimmed = string.replace(/[^0-9.-]*/g, "")
      var amount = parseFloat(trimmed)
      var dollars = Math.floor(amount)
      var remainder = amount - dollars
      var cents = Math.floor(remainder*100)

      return dollars*100 + cents
    }

    function eachOfMyShares(investorId, callback) {
      var portfolio = portfolios[investorId]

      if (!portfolio) { return }

      for(var bondId in portfolio) {
        var shareId = portfolio[bondId]

        callback(shareId, outcomes[bondId], orderStatus[shareId])
      }
    }

    function getOwnerId(shareId) {
      return shareOwner[shareId]
    }

    function getStatus(bondId) {
      return bondStatus[bondId]
    }

    function getOrderStatus(orderId) {
      return orderStatus[orderId]
    }

    function describeOrder(shareId) {
      var bondId = shareAsset[shareId]
      if (!bondId) {
        throw new Error("No share "+shareId)
      }
      return outcomes[bondId]
    }

    function myOrderOn(bondId, myInvestorId) {
      var portfolio = portfolios[myInvestorId]
      if (!portfolio) { return }

      return portfolio[bondId]
    }

    function getOrderAsset(shareId) {
      return shareAsset[shareId]
    }

    function getShareValue(shareId) {
      return shareValue[shareId]
    }

    function getQuote(shareId) {
      return quotes[shareId]
    }

    function getOutcome(bondId) {
      return outcomes[bondId]
    }

    function describeIssuer(bondId) {
      return issuers[bondId]
    }

    // Mutators

    issueBond.registerInvestor =registerInvestor
    issueBond.orderShares = orderShares
    issueBond.markPaid = markPaid
    issueBond.cancelOrder = cancelOrder
    issueBond.expenses = addExpenses
    issueBond.expense = addExpense
    issueBond.tasks = addTasks
    issueBond.invoice = addInvoice
    issueBond.lineItem = lineItem
    issueBond.settleUp = settleUp
    issueBond.revenue = revenue
    issueBond.mature = mature

    // Getters

    issueBond.eachExpense = eachExpense
    issueBond.calculateFinancials = calculateFinancials
    issueBond.getStatus = getStatus
    issueBond.getOrderStatus = getOrderStatus
    issueBond.describeOrder = describeOrder
    issueBond.eachOfMyShares = eachOfMyShares
    issueBond.getInvestorProfile = identifiable.getFrom(investors, "investor")
    issueBond.getOrderAsset = getOrderAsset
    issueBond.myOrderOn = myOrderOn
    issueBond.getOwnerId = getOwnerId
    issueBond.getShareValue = getShareValue
    issueBond.getQuote = getQuote
    issueBond.getOutcome = getOutcome
    issueBond.describeIssuer = describeIssuer
    issueBond.eachActiveBond = eachActiveBond
    issueBond.dailySummary = dailySummary
    issueBond.eachTask = eachTask
    issueBond.nextTaskId = nextTaskId
    issueBond.getTaskText = getTaskText
    issueBond.markFinished = markFinished
    issueBond.getCompletedCount = getCompletedCount
    issueBond.getTaskCount = getTaskCount
    issueBond.bondForTask = bondForTask
    issueBond.date = localDay

    function localDay(time) {
      if (!time) {
        time = new Date()
      }
      var minutesOffset = time.getTimezoneOffset()
      var millisecondsOffset = minutesOffset*60*1000
      var local = new Date(time - millisecondsOffset)
      return local.toISOString().substr(0, 10)
    }

    return issueBond
  }
)