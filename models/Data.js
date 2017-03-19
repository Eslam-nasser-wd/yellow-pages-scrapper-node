const mongoose = require('mongoose')
const config   = require('config')

const DataSchema = mongoose.Schema({
    data: Object,
})

const Data = module.exports = mongoose.model('Data', DataSchema)

// Save new Data
module.exports.saveData = function(newData, callback){    
    newData.save(callback)
}