**issue-bond** is way to write readable bonds in code.

A bond can be issued with three things: a bond id, an outcome, and an issuer name:

```javascript
var bond = issueBond (
  "floor-panel",
  "10% return in 60 days",
  "Erik Pukinskis" )
```

Then you can add work and expenses which are required to achieve the outcome:

```javascript
bond.addTasks ( [
  "buy materials",
  "cut studs to length" ,
  "cut track to length" ,
  "crimp" ,
  "add sheathing" ,
  "flipsulate" ,
  "add sheathing" ] )

bond.expense (
  "16 hours labor" ,
  "$320" )

bond.expense (
  "steel studs" ,
  "$20" )

bond.expense (
  "plywood" ,
  "$10" )
```

The bond is purchased and executed:

```javascript
var investorId = issueBond.registerInvestor(
  "ms-hill",
  "Ms. Learn Hill",
  "203-320-9876" )


var shareId = issueBond.orderShare(
  null ,
  "floor-panel" ,
  "ms-hill" ,
  19000 ,
  16875 )

issueBond.markPaid(
  shareId , {
  "characterId": "ms-hill" ,
  "textSignature": "Eriko" } )

var invoiceid = issueBond.invoice(
  null ,
  "floor-panel" ,
  "advance pay, steel studs, and plywood" ,
  19000 ,
  "2018-01-03" )

issueBond.markFinished (
  "floor-panel",
  "buy materials" )

issueBond.markFinished (
  "floor-panel",
  "cut studs to length" )
//...

// and then there will be some way to mature the bond and pay out the investor here... no need to write that code until we have more revenue than expenses.

```
