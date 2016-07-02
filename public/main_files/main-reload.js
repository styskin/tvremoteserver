setInterval(function () {
    $.ajax({
        url: "gettv",
        timeout: 2000
    }).done(function(data) {
        console.log(JSON.stringify(data));
        if (data.force == "1") {
            $(location).attr('href', data.url);
        } else if (data.url) {
            $("#tit").attr("value", data.url);
        }
    });
}, 3000);
