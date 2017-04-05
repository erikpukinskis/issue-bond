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

    function issueBond(id, amount, issuerName, repaymentSource, data) {
      return new Bond(id, amount, issuerName, repaymentSource, data)
    }

    function Bond(id, options) {

      if (typeof id == "undefined") {
        identifiable.assignId(bonds, this)
      } else if (typeof id.id == "string") {
        this.id = id
      } else {
        this.id = id
      }

      this.rateOfReturn = options.rateOfReturn
      this.termLength = options.termLength

      bonds[this.id] = this
    }

    Bond.prototype.addTasks = Bond.prototype.tasks = function() {
    }

    Bond.prototype.addExpense = Bond.prototype.buy = function() {
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