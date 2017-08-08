var library = require("module-library")(require)

library.define(
  "dashify",
  function() {
    return function dashify(string) {
      if (typeof string !== 'string') {
        throw new TypeError('expected a string');
      }

      var sentence = [];
      var needsDash = false;

      for(var i=0; i<string.length; i++) {
        var char = string[i];

        var isNumber = !Number.isNaN(parseFloat(char));

        if (isNumber) {
          lower = char;
        } else {
          var upper = char.toUpperCase();
          var lower = char.toLowerCase();
          var isLetter = upper != lower;
        } 

        var isAlphaNumeric = isNumber || isLetter;

        if (isNumber) {
          var isUpper = false;
        } else if (isLetter) {
          var isUpper = (char == upper);
        } else {
          var isUpper = false;
        }

        if (needsDash && isAlphaNumeric) {
          sentence.push("-");
          needsDash = false;
        } else if (isUpper && sentence.length) {
          sentence.push("-");
        }

        if (isAlphaNumeric) {
          sentence.push(lower);
        } else if (sentence.length && !isAlphaNumeric) {
          needsDash = true;
        }
      }

      return sentence.join("");
    };
  }
)


module.exports = library.export(
  "issue-bond",
  ["identifiable", "dashify"],
  function(identifiable, dashify) {

    var outcomes = {}
    var issuers = {}
    var bondStatus = {}

    function issueBond(id, outcome, issuerName) {

      if (typeof id != "string") {
        id = identifiable.assignId(bondStatus)
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

    function orderShare(shareId, bondId, investorId, faceValue, quote) {

      if (!investors[investorId]) {
        throw new Error("issueBond.order third parameter should be an investor id. Something's up.")
      }

      if (bondStatus[bondId] != "available") {
        throw new Error("Bond "+bondId+" is not for sale")
      }

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
      orderStatus[shareId] = "paid"
    }


    // Above $1,000,000 total sales we have to file this? https://www.sec.gov/about/forms/forms-1.pdf

    var tasks = {}

    function addTasks(bondId, additionalTasks) {
      var list = tasks[bondId]
      if (list) {
        tasks[bondId] = list.concat(additionalTasks)
      } else {
        tasks[bondId] = additionalTasks
      }
    }

    function eachTask(bondId, callback) {
      for(var i=0; i<tasks[bondId].length; i++) {
        callback(tasks[bondId][i])
      }
    }

    var expenses = {}
    var expenseTotals = {}

    function addExpenses(bondId, totalsByDescription) {
      if (Array.isArray(
        totalsByDescription)) { 
        console.log("Arrays of expenses need to be hashes of expense: price")
        return
      }

      var forThisBond = expenses[bondId]

      if (!expenseTotals[bondId]) {
        expenseTotals[bondId] = 0
      }

      for(var description in totalsByDescription) {

        if (typeof forThisBond == "undefined") {
          forThisBond = expenses[bondId] = {}
        }

        var subtotal = parseMoney(totalsByDescription[description])

        expenseTotals[bondId] += subtotal

        if (typeof forThisBond[description] != "undefined") {
          throw new Error("Already set that expense")
        }

        forThisBond[description] = subtotal
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
        return string
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

    issueBond.registerInvestor =registerInvestor
    issueBond.orderShare = orderShare
    issueBond.markPaid = markPaid
    issueBond.cancelOrder = cancelOrder
    issueBond.expenses = addExpenses
    issueBond.tasks = addTasks

    issueBond.eachExpense = eachExpense
    issueBond.eachTask = eachTask
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



    return issueBond
  }
)