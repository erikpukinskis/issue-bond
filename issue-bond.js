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

    var bonds = {}
    var bondStatus = {}

    function issueBond(id, outcome, issuerName) {
      var bond = new Bond(id, outcome, issuerName)
      bondStatus[bond.id] = "available"
      bonds[bond.id] = bond
      return bond
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
    var shareOwner = {}

    function orderShare(shareId, bondId, investorId, faceValue) {

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
      shareValue[shareId] = faceValue
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

    function markPaid(shareId, price, signature) {

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


    function eachOfMyShares(investorId, callback) {
      var portfolio = portfolios[investorId]

      if (!portfolio) { return }

      for(var bondId in portfolio) {
        var shareId = portfolio[bondId]
        var bond = bonds[bondId]

        callback(shareId, bond.outcome, orderStatus[shareId])
      }
    }

    function getStatus(bondId) {
      return bondStatus[bondId]
    }

    function getOrderStatus(orderId) {
      return orderStatus[orderId]
    }

    function describeOrder(shareId) {
      var bond = bonds[shareAsset[shareId]]
      return bond.outcome
    }

    function myOrderOn(bondId, myInvestorId) {
      var portfolio = portfolios[myInvestorId]
      if (!portfolio) { return }

      return portfolio[bondId]
    }

    issueBond.registerInvestor =registerInvestor
    issueBond.order = orderShare
    issueBond.markPaid = markPaid
    issueBond.cancelOrder = cancelOrder

    issueBond.getStatus = getStatus
    issueBond.getOrderStatus = getOrderStatus
    issueBond.get = identifiable.getFrom(bonds, "bond")
    issueBond.describeOrder = describeOrder
    issueBond.eachOfMyShares = eachOfMyShares
    issueBond.getInvestorProfile = identifiable.getFrom(investors, "investor")
    issueBond.myOrderOn = myOrderOn

    return issueBond
  }
)