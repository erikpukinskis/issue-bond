var library = require("module-library")(require)

module.exports = library.export(
  "issue-bond",
  ["identifiable"],
  function(identifiable) {

    var bonds = {}

    // Shares and share orders are indexed together:
    var shares = {}
    var orders = {}

    // Above $1,000,000 total sales we have to file this? https://www.sec.gov/about/forms/forms-1.pdf

    function issueBond(id, outcome, issuerName) {

      return new Bond(id, outcome, issuerName)
    }

    function Bond(id, outcome, issuerName) {

      this.outcome = outcome
      this.issuerName = issuerName
      this.totalsByDescription = {}
      this.taskList = []
      this.expensesSubtotal = 0

      if (typeof id == "string") {
        this.id = id
      } else {
        this.id = identifiable.assignId(bonds)
      }

      bonds[this.id] = this
    }

    Bond.prototype.tasks = function(additionalTasks) {
      this.taskList = this.taskList.concat(additionalTasks)
    }

    Bond.prototype.getTasks = function() {
      return this.taskList
    }

    Bond.prototype.expenses = function(totalsByDescription) {
      if (Array.isArray(totalsByDescription)) { return }

      for(var description in totalsByDescription) {
        var subtotal = parseMoney(totalsByDescription[description])
        this.expensesSubtotal += subtotal
        this.totalsByDescription[description] = subtotal
      }
    }

    Bond.prototype.salePrice = function() {
      return Math.floor(this.expensesSubtotal*1.1)
    }

    Bond.prototype.totalExpenses = function() {
      return this.expensesSubtotal
    }

    Bond.prototype.profit = function() {
      return this.salePrice() - this.totalExpenses()
    }

    function parseMoney(string) {
      if (typeof string != "string") {
        throw new Error("Expected "+string+" to be a string representing money")
      }
      var trimmed = string.replace(/[^0-9.-]*/g, "")
      var amount = parseFloat(trimmed)
      var dollars = Math.floor(amount)
      var remainder = amount - dollars
      var cents = Math.floor(remainder*100)

      return dollars*100 + cents
    }

    Bond.prototype.eachExpense = function(callback) {
      for(var description in this.totalsByDescription) {
        var total = this.totalsByDescription[description]
        callback(description, total)
      }
    }


    function orderShares(id, name, phoneNumber, bondId, faceValue) {

      var order = {
        id: id,
        purchaserName: name,
        phoneNumber: phoneNumber,
        bondId: bondId,
        faceValue: faceValue,
        isPaid: false,
      }

      if (!id) {
        identifiable.assignId(shares, order)
      }

      orders[order.id] = order

      return order
    }

    function markPaid(orderId, price, signature) {
      var order = getOrder(orderId)
      var bond = getBond(order.bondId)

      if (order.isPaid) {
        throw new Error("Order is already paid")
      }

      order.isPaid = true
      order.paid = price
      bond.shares.push(orderId)
      bond.paid += price
      console.log(bond.paid, "paid on bond")
    }

    var tasksByTag = {}
    function addTask(bondId, text, tags) {
      tags.forEach(function(tag) {
        tag = bondId+"/"+tag
        if (!tasksByTag[tag]) {tasksByTag[tag] = []
        }
        tasksByTag[tag].push(text)
      })
    }

    function eachTaskTagged(bondId, tag, callback) {
      tasksByTag[bondId+"/"+tag].forEach(callback)
    }

    var getBond = issueBond.get = identifiable.getFrom(bonds, {description: "bond"})

    issueBond.task = addTask



    issueBond.eachTaskTagged = eachTaskTagged

    issueBond.order = orderShares

    var getOrder = issueBond.getOrder = identifiable.getFrom(orders, {description: "bond share order"})

    issueBond.markPaid = markPaid

    return issueBond
  }
)