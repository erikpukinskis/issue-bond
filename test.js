var runTest = require("run-test")(require)

runTest(
  "can issue and mature a bond for two days work",
  ["./"],
  function(expect, done, bond) {
    // Day 0

    bond (
      "workshop" )

    bond.expense (
      "workshop" ,
      "build roof, 8 hours" ,
      12 * 1500 )

    bond.expense (
      "workshop" ,
      "plywood, 3x" ,
      3 * 1500 )

    bond.buyShares (
      "workshop" ,
      "erik" ,
      22500 )

    // Day 2

    bond.invoice (
      "workshop" ,
      "jan-7-2018@bobby" 
    )

    bond.invoice.lineItem (
      "workshop" ,
      "jan-7-2108@bobby" ,
      "build roof, 6 hours" ,
      6 * 1500 )

    bond.invoice.lineItem (
      "workshop" ,
      "jan-7-2018@bobby" ,
      "plywood, 3x" ,
      "material" ,
      3 * 1500 )

    bond.invoice.settleUp (
      "workshop" ,
      "jan-7-2018@bobby",
      12000,
      500 )


    // Day 2

    bond.invoice.lineItem ( 
      "workshop",
      "jan-8-2108@bobby" ,
      "build roof, 2 hours, put on roof, 4 hours" ,
      6 * 1500 )

    bond.invoice.lineItem ( 
      "workshop",
      "jan-8-2108@bobby" ,
      "apply roofing, 2 hours" ,
      2 * 1500 )

    bond.invoice.lineItem (
      "workshop",
      "jan-8-2108@bobby" ,
      "roll roofing, nails, and sealant",
      6000 )

    bond.buyShares (
      "workshop",
      "erik",
      9000 )

    bond.invoice.settleUp (
      "workshop",
      "jan-8-2108@bobby",
      18000 )

    bond.revenue (
      "workshop" ,
      "dividends from 36225 shares of tiny-house-1-sale" ,
      36225 )

    bond.invoice (
      "workshop",
      "maturity@erik",
      "maturation of 31500 shares",
      36225 )

    bond.invoice.settleUp (
      "workshop",
      "maturity@erik",
      36225 )

    // (9000 + 22500) * 1.15

    done()
  }
)