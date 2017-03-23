const express = require('express');
const router = express.Router();
const scrapeIt = require('scrape-it');
const rp = require('request-promise');
const request = require('request');
const Data = require('../models/Data')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index')
})

router.get('/api', function(req, res, next) {
  Data.find({}, (err, data) => {
    if(err) throw err;
    res.json(data)
  })
})

router.post('/', function(req, f_res, next) {
  console.log('\non it!\n')
  scrapeIt(req.body.url, {
    totalNumber: 'span.numberOfResults'
  }).then(data => {
    var howManyPages = Math.floor(parseInt(cleanTotalResults(data.totalNumber)) / 20)
    var itemProcessed = 0
    console.log('there is ', howManyPages, ' pages in this link')

    for(let i = 0; i <= howManyPages; i++){
      var currentWorkingUrl = req.body.url+'/p'+(i+1)
      console.log('** working in page ', currentWorkingUrl)
      // Loop through data
      scrapeIt(currentWorkingUrl, {
        items: {
          listItem: '.content-widget',
          data: {
            title: 'a.companyName',
            logo: {
              selector: '.content-image.imageAvailable img',
              attr: 'src'
            },
            address: {
              selector: '.row.address .col-xs-12',
              how: 'html'
            },
            description: '.additionalBar .aboutUs',
            categories_onlyOne: '.category.onlyOne span',
            categories_allRest: {
              selector: '.otherCategories',
              attr: 'data-content'
            },
            keywords_onlyOne: {
              listItem: '.keyword.onlyOne.commaSeparator span'
            },
            keywords_allRest: {
              selector: '.otherKeywords',
              attr: 'data-content'
            },
            phone_link: {
              selector: '.loadPhones.ajaxLoad',
              attr: 'data-link'
            }
          }
        }
      }).then(data => {
          console.log('\nok, so we have some data!\n')
          var phoneProcessed = 0,
              newArray = [];
          data.items.forEach((item, i, thisArray) =>{

            // Remove empty objects
            if(thisArray[i].address === null && thisArray[i].title === '' && thisArray[i].description === '' ){
              let indexOf = thisArray.indexOf(thisArray[i]);
              if (indexOf > -1) {
                  thisArray.splice(indexOf, 1);
              }
            }///

            // Keywords and address clean
            thisArray[i].address = cleanData(thisArray[i].address)
            if(thisArray[i].keywords_allRest === undefined){
              thisArray[i].keywords_allRest = ''
            }
            if(thisArray[i].keywords_onlyOne === undefined){
              thisArray[i].keywords_onlyOne = ''
            }
            thisArray[i].keywords_allRest = thisArray[i].keywords_allRest.split('<br>');
            thisArray[i].keywords = thisArray[i].keywords_onlyOne.concat(thisArray[i].keywords_allRest)
            delete thisArray[i].keywords_allRest;
            delete thisArray[i].keywords_onlyOne;
            thisArray[i].keywords = cleanArray(thisArray[i].keywords)

            // Category clean
            if(thisArray[i].categories_onlyOne === undefined){
              thisArray[i].categories_onlyOne = ''
            }
            if(thisArray[i].categories_allRest === undefined){
              thisArray[i].categories_allRest = ''
            }
            thisArray[i].categories_onlyOne = thisArray[i].categories_onlyOne.split('<br>');
            thisArray[i].categories_allRest = thisArray[i].categories_allRest.split('<br>');
            thisArray[i].categories = thisArray[i].categories_onlyOne.concat(thisArray[i].categories_allRest)
            delete thisArray[i].categories_allRest;
            delete thisArray[i].categories_onlyOne;
            thisArray[i].categories = cleanArray(thisArray[i].categories)

            // Get phones numbers
            // if(thisArray[i].phone_link !== undefined){
            //     var options = {
            //         uri: 'https://www.yellowpages.com.eg'+ thisArray[i].phone_link,
            //         json: true
            //     }
            //     rp(options)
            //       .then(function (json_res) {
            //         thisArray[i].phones = cleanPhonesNumbers(json_res)
            //         console.log(`I got ${phoneProcessed + 1} of ${(thisArray.length)} results`)
            //         if(phoneProcessed === (thisArray.length - 1)) {
            //           console.log('Saving this page data!')
            //           // Save data
            //           var newData = new Data({
            //             data: thisArray
            //           })
            //           Data.saveData(newData, (err, data) =>{
            //             // Send data to the front
            //             console.log('Data saved!')
            //             // f_res.json(thisArray)
            //           })
            //         }else{
            //           phoneProcessed++;
            //         }
            //       })
            //       .catch(function (err) {
            //         console.log('Error: ', err)
            //       });
            // } ///

            newArray.push(thisArray[i])

          })

          var newData = new Data({
            data: newArray
          })
          Data.saveData(newData, (err, data) =>{
            console.log('Data saved!')
          })
      });
    }

  })// end of getting howManyPages.then

});



function cleanPhonesNumbers(code){
  var phones_attr = code.match(/data-content='(...+)'/gim)
  code = code.replace(/'>/g,''); // Remove '>
  code = code.replace(/\+\d/g,''); // Remove +(digit)
  code = code.replace(/<(?:.|\n)*?>/gm, ' '); // Remove html tags
  code = code.replace(/\s+/g,' ').trim(); // Clean un-needed spaces
  if(phones_attr !== null){
    phones_attr = phones_attr.toString()
    phones_attr = phones_attr.replace(/data-content='/gim, ' ')
    phones_attr = phones_attr.replace(/'/gim, '')
    phones_attr = phones_attr.replace(/<br>/gim, ' ')
    code += phones_attr;
  }
  return code;
}


function cleanData(code){
  code = code.replace(/Map it/g,''); // Remove '>
  code = code.replace(/<br>/g,','); // Remove <br>
  code = code.replace(/<(?:.|\n)*?>/gm, ' '); // Remove html tags
  code = code.replace(/\s+/g,' ').trim(); // Clean un-needed spaces
  return code;
}

function cleanTotalResults(code){
  code = code.replace(/Showing/g,''); // Remove '>
  code = code.replace(/Result/g,''); // Remove '>
  code = code.replace(/of/g,''); // Remove '>
  code = code.replace(/\s+/g,' ').trim(); // Clean un-needed spaces
  code = code.replace(/(\d+-\d+)/gim, '')
  return code;
}

function cleanArray(actual) {
  var newArray = new Array();
  for (var i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i]);
    }
  }
  return newArray;
}





























































module.exports = router;





// Helpers
 
  // Remove un-needed spaces 
    // newString = string.replace(/\s+/g,' ').trim();
 
  // Remove un-needed words
    // "data-123".replace(/data-/g,'');
  
  // Get data-content
  // data-content='(...+)'
 
  // Server side ajax call
  // function funcOne(input) { 
  //   var request = require('request');
  //   request.post(someUrl, {json: true, body: input}, function(err, res, body) {
  //       if (!err && res.statusCode === 200) {
  //           funcTwo(body, function(err, output) {
  //               console.log(err, output);
  //           });
  //       }
  //   });
  // }


// function getPhone(url) { 
//   request('https://www.yellowpages.com.eg'+ url, function(err, res, body) {
//       // console.log(cleanPhonesNumbers(body))
//       return cleanPhonesNumbers(body);
//   })
//     .then(data => {
//       console.log('DATA: ', data)
//     });
// }
