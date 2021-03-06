// This script is designed to test the solidity smart contract - SuppyChain.sol -- and the various functions within
// Declare a variable and assign the compiled smart contract artifact
const SupplyChain = artifacts.require('SupplyChain')
// import package to test event emissions
const truffleAssert = require('truffle-assertions')

contract('SupplyChain', function (accounts) {
  // Declare few constants and assign a few sample accounts generated by ganache-cli
  const aircraftPrice = 1000000000000000000 // 1 ETH
  const equipmentPrice = 1000 // 1 Kwei
  const transportFee = 100
  const equipmentUPC = 1
  const componentUPC = 2
  const ownerID = accounts[0]
  const originManufacturerName = 'Bosch'
  const originPlantComponent = 'Aurich'
  const originPlantEquipment = 'Augsburg'
  const originPlantAircraft = 'Hamburg'
  const aircraftNotes = 'A321 NEO ST2 Cabin full economy'
  const equipmentNotes = 'Best Galley'
  const supplierID = accounts[1]
  const transporterID = accounts[2]
  const manufacturerID = accounts[3]
  const customerID = accounts[4]
  const emptyAddress = '0x0000000000000000000000000000000000000000'

  console.log('ganache-cli accounts used here...')
  console.log('Contract Owner: accounts[0] ', accounts[0])
  console.log('Supplier: accounts[1] ', accounts[1])
  console.log('Transporter: accounts[2] ', accounts[2])
  console.log('Manufacturer: accounts[3] ', accounts[3])
  console.log('Customer: accounts[4] ', accounts[4])

  // -------------------------------------TEST Roles contract
  it('can add a Manufacturer Role to an address', async () => {
    const supplyChain = await SupplyChain.deployed()
    assert.equal(await supplyChain.isManufacturer(manufacturerID), false)
    const tx = await supplyChain.addManufacturer(manufacturerID, 'I am a manufacturer')
    assert.equal(await supplyChain.isManufacturer(manufacturerID), true)
    assert.equal(await supplyChain.getNameManufacturer(manufacturerID), 'I am a manufacturer')
    truffleAssert.eventEmitted(tx, 'ManufacturerAdded', ev => {
      return ev.account === manufacturerID && ev.name === 'I am a manufacturer'
    })
  })

  it('can renounce a Manufacturer role', async () => {
    const supplyChain = await SupplyChain.deployed()
    assert.equal(await supplyChain.isManufacturer(ownerID), true)
    await supplyChain.renounceManufacturer({ from: ownerID })
    assert.equal(await supplyChain.isManufacturer(ownerID), false)
  })

  it('can add a Supplier Role to an address', async () => {
    const supplyChain = await SupplyChain.deployed()
    assert.equal(await supplyChain.isSupplier(supplierID), false)
    const tx = await supplyChain.addSupplier(supplierID, 'I am a supplier')
    assert.equal(await supplyChain.isSupplier(supplierID), true)
    assert.equal(await supplyChain.getNameSupplier(supplierID), 'I am a supplier')
    truffleAssert.eventEmitted(tx, 'SupplierAdded', ev => {
      return ev.account === supplierID && ev.name === 'I am a supplier'
    })
  })

  it('can renounce a Supplier role', async () => {
    const supplyChain = await SupplyChain.deployed()
    assert.equal(await supplyChain.isSupplier(ownerID), true)
    await supplyChain.renounceSupplier({ from: ownerID })
    assert.equal(await supplyChain.isSupplier(ownerID), false)
  })

  it('can add a Customer Role to an address', async () => {
    const supplyChain = await SupplyChain.deployed()
    assert.equal(await supplyChain.isCustomer(customerID), false)
    const tx = await supplyChain.addCustomer(customerID, 'I am a customer')
    assert.equal(await supplyChain.isCustomer(customerID), true)
    assert.equal(await supplyChain.getNameCustomer(customerID), 'I am a customer')
    truffleAssert.eventEmitted(tx, 'CustomerAdded', ev => {
      return ev.account === customerID && ev.name === 'I am a customer'
    })
  })

  it('can renounce a Customer role', async () => {
    const supplyChain = await SupplyChain.deployed()
    assert.equal(await supplyChain.isCustomer(ownerID), true)
    await supplyChain.renounceCustomer({ from: ownerID })
    assert.equal(await supplyChain.isCustomer(ownerID), false)
  })

  it('can add a Transporter Role to an address', async () => {
    const supplyChain = await SupplyChain.deployed()
    assert.equal(await supplyChain.isTransporter(transporterID), false)
    const tx = await supplyChain.addTransporter(transporterID, 'I am a transporter')
    assert.equal(await supplyChain.isTransporter(transporterID), true)
    assert.equal(await supplyChain.getNameTransporter(transporterID), 'I am a transporter')
    truffleAssert.eventEmitted(tx, 'TransporterAdded', ev => {
      return ev.account === transporterID && ev.name === 'I am a transporter'
    })
  })

  it('can renounce a Transporter role', async () => {
    const supplyChain = await SupplyChain.deployed()
    assert.equal(await supplyChain.isTransporter(ownerID), true)
    await supplyChain.renounceTransporter({ from: ownerID })
    assert.equal(await supplyChain.isTransporter(ownerID), false)
  })

  // -------------------------------------TEST SupplyChain contract

  it('a customer can order an aircraft', async () => {
    const supplyChain = await SupplyChain.deployed()
    // Supplier mark AC as ordered
    const tx = await supplyChain.orderAircraft(
      equipmentUPC,
      manufacturerID,
      { from: customerID, value: web3.utils.toWei('1', 'ether') })

    // Fetch AC
    const aircraft = await supplyChain.fetchAircraft(1)

    // Checks
    assert.equal(aircraft[0], 1, 'Error: invalid or missing MSN')
    assert.equal(aircraft[1], equipmentUPC, 'Error: missing or invalid equipment upc')
    assert.equal(aircraft[2], aircraftPrice, 'Error: missing or invalid aircraft price')
    assert.equal(aircraft[3], 1, 'Error: state should ordered (1) at this stage')
    assert.equal(aircraft[4], emptyAddress, 'Error: ownerID should be empty at this stage')
    assert.equal(aircraft[5], manufacturerID, 'Error: Missing or Invalid manufacturerID')
    assert.equal(aircraft[6], '', 'Error: originPlant should be empty at this stage')
    assert.equal(aircraft[7], '', 'Error: aircraftNotes should be empty at this stage')
    assert.equal(aircraft[8], customerID, 'Error: Missing or Invalid customerID')

    // Check money transfer
    assert.equal(await supplyChain.pendingWithdrawals(manufacturerID), aircraftPrice * 0.5)

    // Event check
    truffleAssert.eventEmitted(tx, 'Ordered', event => {
      return event.asset === 'Aircraft', event.id == 1
    })
  })


  it('a manufacturer can order an equipment for an Ordered aircraft', async () => {
    const supplyChain = await SupplyChain.deployed()

    // Manufacturer marks equipment as ordered
    const tx = await supplyChain.orderEquipment(
      equipmentUPC,
      supplierID,
      1,
      { from: manufacturerID, value: web3.utils.toWei('1', 'Kwei') })

    // Fetch equipment
    const equipment = await supplyChain.fetchEquipment(equipmentUPC)

    // Checks
    assert.equal(equipment[0], equipmentUPC, 'Error: invalid equipment UPC')
    assert.equal(equipment[1], 0, 'Error: componentID should be 0 at this stage')
    assert.equal(equipment[2], 1, 'Error: invalid or missing msn')
    assert.equal(equipment[3], equipmentPrice, 'Error: Missing or Invalid price')
    assert.equal(equipment[4], 1, 'Error: state should be ordered (1) at this stage')
    assert.equal(equipment[5], emptyAddress, 'Error: owner address should be empty at this stage')
    assert.equal(equipment[6], supplierID, 'Error: Missing or Invalid supplierID')
    assert.equal(equipment[7], '', 'Error: originPlant should be empty at this stage')
    assert.equal(equipment[8], '', 'Error: equipmentNotes should be empty at this stage')
    assert.equal(equipment[9], emptyAddress, 'Error: transporter address should be empty at this stage')
    assert.equal(equipment[10], manufacturerID, 'Error: missing or invalid manufacturer address')

    // Check money transfer
    assert.equal(await supplyChain.pendingWithdrawals(supplierID), equipmentPrice)

    // check event
    truffleAssert.eventEmitted(tx, 'Ordered', ev => {
      return ev.asset === 'Equipment' && ev.id == equipmentUPC
    })
  })

  it('a supplier can receive a Component for an Ordered Equipment', async () => {
    const supplyChain = await SupplyChain.deployed()

    // Supplier marks component as received
    const tx = await supplyChain.receiveComponent(
      componentUPC,
      originManufacturerName,
      originPlantComponent,
      equipmentUPC,
      { from: supplierID })
    // Retrieve saved Component from blockchain with fetchComponent()
    const component = await supplyChain.fetchComponent.call(componentUPC)

    // Checks
    assert.equal(component[0], componentUPC, 'Error: missing or invalid component UPC')
    assert.equal(component[1], equipmentUPC, 'Error: missing or Invalid equipment UPC')
    assert.equal(component[2], 5, 'Error: state should be "received" (5) at this stage')
    assert.equal(component[3], originManufacturerName, 'Error: Missing or Invalid originManufacturerName')
    assert.equal(component[4], originPlantComponent, 'Error: Missing or Invalid originPlant')
    assert.equal(component[5], supplierID, 'Error: Missing or Invalid supplierID')

    // check event:
    truffleAssert.eventEmitted(tx, 'Received', ev => {
      return ev.asset === 'Component' && ev.id == componentUPC
    })
  })

  it('a supplier can process a Received Component to assemble an Ordered Equipment', async () => {
    const supplyChain = await SupplyChain.deployed()
    // Supplier marks component as integrated and equipment as assembled
    const tx = await supplyChain.processComponent(
      componentUPC,
      originPlantEquipment,
      equipmentNotes,
      { from: supplierID })

    // Fetch assets
    const equipment = await supplyChain.fetchEquipment(equipmentUPC)
    const component = await supplyChain.fetchComponent(componentUPC)

    // Check assets attributes
    assert.equal(component[2], 6, "Error: component state should be 'Integrated' (6) at this stage")

    assert.equal(equipment[1], componentUPC, 'Error: missing or invalid componentID')
    assert.equal(equipment[4], 2, 'Error: equipment state should be "Assembled" (2) at this stage')
    assert.equal(equipment[5], supplierID, 'Error: missing or invalid owner address')
    assert.equal(equipment[7], originPlantEquipment, 'Error: missing or invalid originPlantEquipment')
    assert.equal(equipment[8], equipmentNotes, 'Error: missing or invalid equipmentNotes')

    truffleAssert.eventEmitted(tx, 'Assembled', event => {
      return event.asset === 'Equipment' && event.id == equipmentUPC
    })
    truffleAssert.eventEmitted(tx, 'Integrated', event => {
      return event.asset === 'Component' && event.id == componentUPC
    })
  })

  it('a manufacturer can prepare the structure of an Ordered Aircraft', async () => {
    const supplyChain = await SupplyChain.deployed()

    // Manufacturer marks AC as structureReady
    const tx = await supplyChain.prepareStructure(
      1,
      originPlantAircraft,
      aircraftNotes,
      { from: manufacturerID })

    // Fetch AC
    const aircraft = await supplyChain.fetchAircraft(1)

    // Checks
    assert.equal(aircraft[3], 7, 'Error: aircraft state should be "StructureReady" (7) at this stage')
    assert.equal(aircraft[4], manufacturerID, 'Error:missing or invalid manufacturerID')
    assert.equal(aircraft[6], originPlantAircraft, 'Error:missing or invalid originPlantAircraft')
    assert.equal(aircraft[7], aircraftNotes, 'Error:missing or invalid aircraftNotes')

    truffleAssert.eventEmitted(tx, 'StructureReady', event => {
      return event.msn == 1
    })
  })

  it('a supplier can pack an Equipment he assembled', async () => {
    const supplyChain = await SupplyChain.deployed()

    // Supplier marks item as packed
    const tx = await supplyChain.packEquipment(
      equipmentUPC,
      transporterID,
      { from: supplierID, value: transportFee * 0.5 })

    // Fetch equipment
    const equipment = await supplyChain.fetchEquipment(equipmentUPC)

    // Checks
    assert.equal(equipment[4], 3, 'Error: equipment state should be "Packed" (3) at this stage')
    assert.equal(equipment[9], transporterID, 'Error: missing or invalid transporter address')

    // Check money transfer
    assert.equal(await supplyChain.pendingWithdrawals(transporterID), 0.5 * transportFee)

    truffleAssert.eventEmitted(tx, 'Packed', event => {
      return event.id == equipmentUPC
    })
  })

  it('a transporter can transport a Packed Equipment', async () => {
    const supplyChain = await SupplyChain.deployed()

    // Transporter marks item as InTransit
    const tx = await supplyChain.transportEquipment(equipmentUPC, { from: transporterID })

    // Fetch equipment
    const equipment = await supplyChain.fetchEquipment(equipmentUPC)

    // Checks
    assert.equal(equipment[4], 4, 'Error: equipment state should be "InTransit" (4) at this stage')
    assert.equal(equipment[5], transporterID, 'Error: missing or invalid owner address')

    truffleAssert.eventEmitted(tx, 'InTransit', event => {
      return event.id == equipmentUPC
    })
  })

  it('a manufacturer can receive an InTransit Equipment he ordered', async () => {
    const supplyChain = await SupplyChain.deployed()

    // Manufactuer marks item as InTransit
    const tx = await supplyChain.receiveEquipment(equipmentUPC, { from: manufacturerID, value: transportFee * 0.5 })

    // Fetch equipment
    const equipment = await supplyChain.fetchEquipment(equipmentUPC)

    // Checks
    assert.equal(equipment[4], 5, 'Error: equipment state should be "Received" (5) at this stage')
    assert.equal(equipment[5], manufacturerID, 'Error: missing or invalid owner address')

    // Check money transfer
    assert.equal(await supplyChain.pendingWithdrawals(transporterID), transportFee)

    // Check event
    truffleAssert.eventEmitted(tx, 'Received', event => {
      return event.id == equipmentUPC
    })
  })

  it('a manufacturer can process a Received Equipment to assemble a StructureReady Aircraft that a customer ordered him', async () => {
    const supplyChain = await SupplyChain.deployed()

    // Manufactuer marks equipment as Integrated and aircraft as Assembled
    const tx = await supplyChain.processEquipment(equipmentUPC, 'No further notes', { from: manufacturerID })

    // Fetch assets
    const equipment = await supplyChain.fetchEquipment(equipmentUPC)
    const aircraft = await supplyChain.fetchAircraft(equipment[2])

    // Checks
    assert.equal(equipment[4], 6, 'Error: equipment state should be "Integrated" (6) at this stage')

    assert.equal(aircraft[3], 2, 'Error: aircraft state should be "Assembled" (2) at this stage')
    assert.equal(aircraft[7], aircraftNotes + ', Assembly stage: ' + 'No further notes', 'Error: invalid aircraftNotes')

    truffleAssert.eventEmitted(tx, 'Integrated', event => {
      return event.asset === 'Equipment' && event.id == equipmentUPC
    })
    truffleAssert.eventEmitted(tx, 'Assembled', event => {
      return event.asset === 'Aircraft' && event.id == 1
    })
  })

  it('a customer can receive an Assembled aircraft he ordered', async () => {
    const supplyChain = await SupplyChain.deployed()

    // Customer marks aircraft as received
    const tx = await supplyChain.receiveAircraft(1, { from: customerID, value: aircraftPrice * 0.5 })

    // Fetch aircraft
    const aircraft = await supplyChain.fetchAircraft(1)

    // Checks
    assert.equal(aircraft[0], 1, 'Error: invalid msn')
    assert.equal(aircraft[1], equipmentUPC, 'Error: invalid equipmentID')
    assert.equal(aircraft[2], aircraftPrice, 'Error: invalid aircraftPrice')
    assert.equal(aircraft[3], 5, 'Error: aircraft state should be "Received"')
    assert.equal(aircraft[4], customerID, 'Error: invalid ownerID')
    assert.equal(aircraft[5], manufacturerID, 'Error: invalid manufacturerID')
    assert.equal(aircraft[6], originPlantAircraft, 'Error: invalid originPlantAircraft')
    assert.equal(aircraft[7], aircraftNotes + ', Assembly stage: ' + 'No further notes', 'Error: invalid aircraftNotes')
    assert.equal(aircraft[8], customerID, 'Error: invalid customer address')

    // Check money transfer
    assert.equal(await supplyChain.pendingWithdrawals(manufacturerID), aircraftPrice)

    truffleAssert.eventEmitted(tx, 'Received', event => {
      return event.asset === 'Aircraft' && event.id == 1
    })
  })

  it('a manufacturer can withdraw his money', async () => {
    const supplyChain = await SupplyChain.deployed()
    // console.log(await supplyChain.pendingWithdrawals(supplierID))
    // console.log(await supplyChain.pendingWithdrawals(supplierID))
    // console.log(await supplyChain.pendingWithdrawals(transporterID))
    const balanceBefore = await web3.eth.getBalance(manufacturerID)
    // console.log(balanceBefore)
    await supplyChain.withdraw({ from: manufacturerID })
    const balanceAfter = await web3.eth.getBalance(manufacturerID)
    assert.isAbove(+balanceAfter, +balanceBefore)
  })
})
