$(function(){
    $('.sendUrl').click(function(){
        var url = {
            url: $('#yp_url').val()
        }
        $('.loader').fadeIn()
        $.ajax({
            url: '/',
            type: 'POST',
            data: url,
            success: function(e){
                // console.log(e)
                $('.counter span').text(e.length)
                $('tbody').html('')
                e.forEach(function(item){
                    var logo_url = item.logo ? item.logo : 'img/no_logo.jpg'
                    var keywords = item.keywords ? item.keywords : '<span class="btn btn-danger pmd-ripple-effect">No keywords available</span>'
                    var description = item.description ? item.description.substring(0, 25)+'...' : '<span class="btn btn-danger pmd-ripple-effect">No description available</span>'
                    var address = item.address ? item.address : '<span class="btn btn-danger pmd-ripple-effect">No address available</span>'
                    var title = item.title ? item.title : '<span class="btn btn-danger pmd-ripple-effect">No title available</span>'
                    var phones = item.phones ? item.phones : '<span class="btn btn-danger pmd-ripple-effect">No phones available</span>'
                    var categories = item.categories ? item.categories : '<span class="btn btn-danger pmd-ripple-effect">No categories available</span>'
                    
                    $('tbody').append(`
                        <tr>
                            <td><img src="${logo_url}"></td>
                            <td>${title}</td>
                            <td>${address}</td>
                            <td>${phones}</td>
                            <td>${description}</td>
                            <td>${categories}</td>
                            <td>${keywords}</td>
                        </tr>
                    `)
                })
                $('.loader').fadeOut(function(){
                    $('#table_page').fadeIn()
                })
            },
            error: function(e){
                console.log(e)
            }
        })

    })
});