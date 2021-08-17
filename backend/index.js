const express = require('express')
const bodyParser = require('body-parser')
const app = express()

//array that holds transactions
let transactions = []

//Variable to keep track of total User points
let userPoints = 0

//Map that is used to keep track of payer point balances as it fluctuates
const pointMap = new Map()

app.get('/', (req, res) => res.send("This works"))

const port = process.env.PORT || 5000
app.listen(port, () => console.log(`Server is up on port ${port}`))

app.use(bodyParser.urlencoded({extended: true}))
app.put('/createTransaction', (req, res) => {
    addTransaction(req.body.payer, Number(req.body.points), req.body.timeStamp)
    console.log(transactions)
    console.log(pointMap)
    console.log(userPoints)
    res.send("This route has been hit.")
})


//Route to handle the spending of points
app.put('/spend/:points', (req, res) => {
    if(transactions.length == 0){
        res.send("The transactions array is empty, therefore there no points can be spent.")
    }
    else{
        res.json(spendPoints(req.params.points))
    }

})


//Route to handle returning payer point balances
app.get('/payerBalances', (req, res) => {
    if(transactions.length == 0){
        res.send("The transactions array is empty, therefore there are no payer point balances.")
    }
    else{
        res.json(Array.from(pointMap))
    }
})


//Function that creates a transaction record and adds it to transactions array
function addTransaction(company, points, date){
    let newTransaction = {
        payer: company,
        points: points,
        timeStamp: date,
    }

    transactions.push(newTransaction)
    transactions.sort(function (a, b){
        return new Date(a.timeStamp) - new Date(b.timeStamp)
    })
    populateMap(newTransaction)
    userPoints += newTransaction.points
}


//Function models spending formula that is outlined in project specs
function spendPoints(points){
    let pointsLeft = points
    let pointsTaken = new Map()
    
    if(points > userPoints){
        return "You can not spend more points than the user has"
    }
    for(let i = 0; i < transactions.length; i++){
        if(pointsLeft == 0){
            break
        }
        else{
            //If transaction points are positive
            if(transactions[i].points > 0){
                if(transactions[i].points < pointsLeft)
                {
                    pointsLeft = pointsLeft - transactions[i].points
                    pointMap.set(transactions[i].payer, pointMap.get(transactions[i].payer) - transactions[i].points)

                    if(!pointsTaken.has(transactions[i].payer)){
                        let payer = transactions[i].payer
                        let pointVal = transactions[i].points
                        pointsTaken.set(payer, -pointVal)
                    }
                    else{
                        let pointVal = transactions[i].points
                        pointsTaken.set(transactions[i].payer, pointsTaken.get(transactions[i].payer) - pointVal)
                    } 
                }
                else{
                    pointMap.set(transactions[i].payer, pointMap.get(transactions[i].payer) - pointsLeft)
                    if(!pointsTaken.has(transactions[i].payer)){
                        let payer = transactions[i].payer
                        let pointVal = pointsLeft
                        pointsTaken.set(payer, -pointsLeft)
                    }
                    else{
                        let pointVal = pointsLeft
                        pointsTaken.set(transactions[i].payer, pointsTaken.get(transactions[i].payer) - pointVal)
                    } 
                    pointsLeft = 0
                }
                console.log("POINTS LEFT:", pointsLeft)
            }
            //If transaction points are negative
            else{
                pointsLeft += (transactions[i].points * -1)
                console.log("POINTS LEFT:", pointsLeft)
                pointMap.set(transactions[i].payer, pointMap.get(transactions[i].payer) + (transactions[i].points * -1))

                if(!pointsTaken.has(transactions[i].payer)){
                    let payer = transactions[i].payer
                    let pointVal = transactions[i].points
                    pointsTaken.set(payer, pointVal)
                }
                else{
                    let pointVal = transactions[i].points
                    pointsTaken.set(transactions[i].payer, pointsTaken.get(transactions[i].payer) - pointVal)
                } 
            }
        }
    }
    return Array.from(pointsTaken)
}


//Function to fill pointMap variable with elements
function populateMap(newTransactionRecord){
    if(!pointMap.has(newTransactionRecord.payer)){
        let payer = newTransactionRecord.payer
        let pointVal = newTransactionRecord.points
        pointMap.set(payer, pointVal)
    }
    else{
        let pointVal = newTransactionRecord.points
        pointMap.set(newTransactionRecord.payer, pointMap.get(newTransactionRecord.payer) + pointVal)
    } 
}