var inquirer = require("inquirer");
var mysql = require("mysql");

var connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    // Removed pw for security
    database: 'greatBayDB'
})

connection.connect(function (err) {
    if (err) throw err
    start()
})

function start() {
    inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'Would you like to Post or Bid on an item?',
            choices: ['Post', 'Bid']
        }
    ]).then(function (answers) {
        console.log('----- ' + answers.choice.toUpperCase() + ' -----')
        if (answers.choice === 'Post') {
            post()
        } else {
            displayDB()
        }
    })
}

function post() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'itemName',
            message: 'What are you selling?'
        },
        {
            type: 'input',
            name: 'itemDescription',
            message: "Describe your item."
        },
        {
            type: 'input',
            name: 'startingBid',
            message: 'What should the bidding begin at?',
            validate: function (value) {
                if (!isNaN(value)) {
                    return true
                } else {
                    return 'Numbers only please.'
                }
            }
        }
    ]).then(function (response) {
        var values = []

        values.push(response.itemName)
        values.push(response.itemDescription)
        values.push(response.startingBid)

        postDB(values)
    })
}

function postDB(values) {
    connection.query('INSERT INTO items SET ?',
        {
            item: values[0],
            details: values[1],
            starting_bid: values[2],
            highest_bid: values[2]
        },
        function (err) {
            if (err) throw err

            console.log('Your item is listed as ' + values[0] + ' for $' + values[2] + ' dollars!')

            start()
        })
}

function displayDB() {
    var itemsArr = []

    connection.query('select * from items', function (err, res) {
        if (err) throw err
        for (var i = 0; i < res.length; i++) {
            itemsArr.push(res[i].id.toString())
            console.log(
                'Item Number: ' + res[i].id
                 + '\nItem: ' + res[i].item 
                 + '\nDescription: ' + res[i].description 
                 + '\nStarting Bid $' + res[i].starting_bid 
                 + '\n----------------------------------------')
        }
        bid(itemsArr)
    })
}

function bid(itemsArr) {
    inquirer.prompt([
        {
            type: 'list',
            name: 'choice',
            message: 'Which Item Number would you like to bid on?',
            choices: itemsArr
        },
        {
            type: 'input',
            name: 'bid',
            message: 'How much would you like to bid?'
        }
    ]).then(function (response) {
        var bid = []

        bid.push(response.bid)
        bid.push(response.choice)

        checkBid(bid)
    })
}

function updateBid(bid) {
    console.log('Congrats!!!!\nYou are now the highest bidder at ' + bid[0] + '!')
    connection.query('update items set ? where ?',
        [
            {
                highest_bid: bid[0]
            },
            {
                id: bid[1]
            },
        ])
    start()
}

function checkBid(bid) {
    var highestBid

    connection.query('select * from items where id=(?)', [bid[1]], function (err, res) {
        highestBid = res[0].highest_bid;

        if (bid[0] > highestBid) {
            updateBid(bid)
        } else {
            console.log('Sorry your bid was too low!\nPlease try again!')
            start()
        }
    })
}