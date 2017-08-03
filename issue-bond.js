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
    var bondShares = {}

    function orderShare(shareId, bondId, investorId, faceValue) {

      if (!investors[investorId]) {
        throw new Error("issueBond.order third parameter should be an investor id. Something's up.")
      }

      shareId = identifiable.assignId(orders, shareId)

      var shares = bondShares[bondId]
      if (!shares) {
        shares = bondStatus[bondId] = []
      }

      shares.push(shareId)

      var portfolio = portfolios[investorId]

      if (!portfolio) {
        portfolio = portfolios[investorId] = []
      }

      portfolio.push(shareId)
      shareAsset[shareId] = bondId
      bondStatus[bondId] = "pending"
      orderStatus[shareId] = "pending"
      shareValue[shareId] = faceValue
      shareOwner[shareId] = investorId

      return shareId
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

      portfolio.forEach(function(shareId) {
        var bondId = shareAsset[shareId]
        var bond = bonds[bondId]

        var data = {
          shareId: shareId,
          outcome: bond.outcome,
          status: orderStatus[shareId],
        }

        callback(data)
      })
    }

    function markPaid(orderId, price, signature) {

      var bondId = shareAsset[orderId]

      if (orderStatus[orderId] == "paid") {
        throw new Error("Order is already paid")
      } else if (bondStatus[bondId] == "sold") {
        throw new Error("Bond is already sold")
      }

      bondStatus[bondId] = "sold"
      orderStatus[id] = "paid"
    }

    function getStatus(bondId) {
      return bondStatus[bondId]
    }

    function describeOrder(shareId) {
      var bond = bonds[shareAsset[shareId]]
      return bond.outcome
    }

    issueBond.registerInvestor =registerInvestor
    issueBond.order = orderShare
    issueBond.markPaid = markPaid

    issueBond.getStatus = getStatus
    issueBond.get = identifiable.getFrom(bonds, "bond")
    issueBond.describeOrder = describeOrder
    issueBond.eachOfMyShares = eachOfMyShares
    issueBond.getInvestorProfile = identifiable.getFrom(investors, "investor")

    return issueBond
  }
)