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

router.post('/', function(req, f_res, next) {
  console.log('\non it!\n')
  // Loop through data
  scrapeIt(req.body.url, {
    items: {
      listItem: ".content-widget",
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
      var itemsProcessed = 0;
      data.items.forEach((item, i, thisArray) =>{
        // Remove empty objects
        if(thisArray[i].address === null && thisArray[i].title === '' && thisArray[i].description === '' ){
          let indexOf = thisArray.indexOf(thisArray[i]);
          if (indexOf > -1) {
              thisArray.splice(indexOf, 1);
          }
        }///

        // Clean the data and merge them
        thisArray[i].address = cleanData(thisArray[i].address)
        if(thisArray[i].keywords_allRest !== undefined){
          thisArray[i].keywords_allRest = thisArray[i].keywords_allRest.split('<br>');
          thisArray[i].keywords = thisArray[i].keywords_onlyOne.concat(thisArray[i].keywords_allRest)
          delete thisArray[i].keywords_allRest;
          delete thisArray[i].keywords_onlyOne;
        }
        if(thisArray[i].categories_allRest !== undefined){
          thisArray[i].categories_allRest = thisArray[i].categories_allRest.split('<br>');
          thisArray[i].categories_onlyOne = thisArray[i].categories_onlyOne.split('<br>');
          thisArray[i].categories = thisArray[i].categories_onlyOne.concat(thisArray[i].categories_allRest)
          delete thisArray[i].categories_allRest;
          delete thisArray[i].categories_onlyOne;
        }///


        // Get phones numbers
        if(thisArray[i].phone_link !== undefined){
            var options = {
                uri: 'https://www.yellowpages.com.eg'+ thisArray[i].phone_link,
                json: true
            }
            rp(options)
              .then(function (json_res) {
                thisArray[i].phones = cleanPhonesNumbers(json_res)
                console.log(itemsProcessed, (thisArray.length - 1))
                if(itemsProcessed === (thisArray.length - 1)) {
                  console.log('all done!')
                  // Save data
                  var newData = new Data({
                    data: thisArray
                  })
                  Data.saveData(newData, (err, data) =>{
                    // Send data to the front
                    f_res.json(thisArray)
                  })
                }else{
                  itemsProcessed++;
                }
              })
              .catch(function (err) {
                console.log('Error: ', err)
              });
        } ///

      })
  });
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
  //code = code.replace(/\+\d/g,''); // Remove +(digit)
  code = code.replace(/<(?:.|\n)*?>/gm, ' '); // Remove html tags
  code = code.replace(/\s+/g,' ').trim(); // Clean un-needed spaces
  return code;
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
