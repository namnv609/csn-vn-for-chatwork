$(function() {
  var _yqlAPIEndpoint = "https://query.yahooapis.com/v1/public/yql?q=";
  var _csnSearchURL = "http://search.chiasenhac.vn/search.php?s=";
  var _csnBaseURL = "http://chiasenhac.vn/";

  $.get(chrome.extension.getURL('assets/template/player.html'), function(data) {
    $("body").append(data);
  });

  $("body").on("click", "#nnvsvc-csn-player span.toggle-panel", function() {
    var $parentElement = $(this).closest("#nnvsvc-csn-player");
    var rightPixel = "-420px";
    var spanText = "<";

    if ($parentElement.css("right") === "-420px") {
      rightPixel = "0px";
      spanText = ">";
    }

    $(this).closest("#nnvsvc-csn-player").animate({
      "right": rightPixel
    }, "slow", function() {
      $(this).text(spanText);
    }.bind(this));
  });

  $("body").on("click", "#csn-search", function() {
    chiaSeNhacSearch();
  });

  $("body").on("keypress", "#csn-kw", function(evt) {
    if (evt.which === 13) {
      chiaSeNhacSearch();
    }
  });

  $("body").on("click", "#nnvsvc-csn-player .csn-result-item", function() {
    var csnLink = $(this).data("csnLink");

    $("#nnvsvc-csn-player .csn-result-item").removeClass("activated");
    $(this).addClass("activated");

    chiaSeNhacPlayMusic(csnLink);
  });

  function chiaSeNhacSearch() {
    var keyword = $("#csn-kw").val().trim();

    if (keyword) {
      var searchURL = _csnSearchURL + encodeURIComponent(keyword) + "&cat=music";
      var yqlStatement = [
        "SELECT * FROM html WHERE url='",
        searchURL,
        "' and xpath='//table[@class=\"tbtable\"]",
        "//tr[position() > 1]//div[@class=\"tenbh\"]",
        " | //table[@class=\"tbtable\"]//tr[position() > 1]//span[@class=\"gen\"]'"
      ].join("");

      $.ajax({
        url: _yqlAPIEndpoint + encodeURIComponent(yqlStatement) + "&format=json"
      }).done(function(response) {
        var responseResults = response.query.results;
        if (Object.keys(responseResults).length) {
          showSearchResult(responseResults);
        }
      }).fail(function(xmlHttpReq, ajaxOpts, error) {
        console.log(error);
      });
    } else {
      $("#csn-kw").focus();
    }
  }

  function showSearchResult(resultList) {
    var resultGenerals = resultList.span;
    var resultItems = resultList.div;
    var $searchResult = $(".csn-search-result");
    $searchResult.empty();

    resultItems.map(function(item, idx) {
      var $resultItem = $("#csn-template .csn-result-item").clone();
      var resultGeneral = resultGenerals[idx];

      $resultItem.find(".song-name").text(item.p[0].a.content);
      $resultItem.find(".artist").text(item.p[1]);
      $resultItem.find(".duration").text(resultGeneral.content);
      $resultItem.find(".quality").text(resultGeneral.span.content);

      $searchResult.append($resultItem.attr("data-csn-link", item.p[0].a.href).removeClass("hidden"));
    });
  }

  function chiaSeNhacPlayMusic(csnLink) {
    var yqlStatement = [
      "SELECT * FROM html WHERE url='",
      _csnBaseURL + csnLink,
      "' AND xpath='//div[@align=\"left\"]//script[not(@src)]'"
    ].join("");

    $.ajax({
      url: _yqlAPIEndpoint + encodeURIComponent(yqlStatement) + "&format=json"
    }).done(function(response) {
      var results = response.query.results;

      if (results.script.length) {
        var jsContent = results.script[0].content;
        jsContent = jsContent.match(/(?!title\:)\".*\"/g);
        $("#nnvsvc-csn-player .csn-player").html('<audio controls loop autoplay><source src="' + jsContent[1].replace(/^\"|\"$/, '') + '" /></audio>')
      }

    }).fail(function(xmlHttpReq, ajaxOpts, error) {
      console.log(error);
    });
  }
});
