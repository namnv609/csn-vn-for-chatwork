$(function() {
  var _yqlAPIEndpoint = "https://query.yahooapis.com/v1/public/yql?q=";
  var _csnSearchURL = "http://search.chiasenhac.vn/search.php?s=";
  var _csnBaseURL = "http://chiasenhac.vn/";

  $.get(chrome.extension.getURL('assets/template/player.html'), function(data) {
    $("body").append(data);
  });

  $("body").on("click", "#nnvsvc-csn-player span.toggle-panel", function() {
    toggleCSNPanel($(this));
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
    var csnQuality = $(this).data("quality");

    $("#nnvsvc-csn-player .csn-result-item").removeClass("activated");
    $(this).addClass("activated");

    chiaSeNhacPlayMusic(csnLink, csnQuality);
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

      toggleCSNLoading();
      $.ajax({
        url: _yqlAPIEndpoint + encodeURIComponent(yqlStatement) + "&format=json"
      }).done(function(response) {
        var responseResults = response.query.results;
        if (Object.keys(responseResults).length) {
          showSearchResult(responseResults);
        }
      }).fail(function(xmlHttpReq, ajaxOpts, error) {
        console.log(error);
      }).always(function() {
        toggleCSNLoading();
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
      var songQuality = (typeof resultGeneral.span !== "undefined" ? resultGeneral.span.content : "64kbps");

      $resultItem.find(".song-name").text(item.p[0].a.content);
      $resultItem.find(".artist").text(item.p[1]);
      $resultItem.find(".duration").text(resultGeneral.content);
      $resultItem.find(".quality").text(songQuality);

      $searchResult.append(
        $resultItem
          .attr({
            "data-csn-link": item.p[0].a.href,
            "data-quality": songQuality
          })
          .removeClass("hidden")
      );
    });
  }

  function chiaSeNhacPlayMusic(csnLink, musicQuality) {
    var yqlStatement = [
      "SELECT * FROM html WHERE url='",
      _csnBaseURL + csnLink,
      "' AND xpath='//div[@align=\"left\"]//script[not(@src)]'"
    ].join("");

    toggleCSNLoading();
    $.ajax({
      url: _yqlAPIEndpoint + encodeURIComponent(yqlStatement) + "&format=json"
    }).done(function(response) {
      var results = response.query.results;

      if (results.script.length) {
        var jsContent = results.script[0].content;
        jsContent = jsContent.match(/(?!title\:)\".*\"/g);
        var musicLink = jsContent[1].replace(/^\"|\"$/g, "");
        musicLink = getBestQualityMusic(musicLink, musicQuality);

        $("#nnvsvc-csn-player .csn-player").html('<audio controls loop autoplay><source src="' + musicLink + '" /></audio>')
      }

    }).fail(function(xmlHttpReq, ajaxOpts, error) {
      console.log(error);
    }).always(function() {
      toggleCSNLoading();
    });
  }

  function toggleCSNPanel($toggleElement) {
    var $parentElement = $toggleElement.closest("#nnvsvc-csn-player");
    var rightPixel = "-420px";
    var spanText = "<";

    if ($parentElement.css("right") === "-420px") {
      rightPixel = "0px";
      spanText = ">";
    }

    $toggleElement.closest("#nnvsvc-csn-player").animate({
      "right": rightPixel
    }, "slow", function() {
      $toggleElement.text(spanText);
      if (spanText === ">") {
        $("#csn-kw").select();
      }
    });
  }

  function toggleCSNLoading() {
    $("#nnvsvc-overlay").toggle();
  }

  function getBestQualityMusic(csnLink, musicQuality) {
    var bestQuality = "32";
    var listQuality = ["32", "64", "128", "192", "320", "m4a"];
    var linkRegExp = new RegExp("/(" + listQuality.join("|") + ")/");
    var musicExtension = ".m4a";

    switch(musicQuality.toLowerCase()) {
      case "32kpbs":
      case "64kbps":
      case "128kbps":
        bestQuality = musicQuality.replace(/\D+/, "");
        musicExtension = ".mp3";
        break;
      case "192kbps":
      case "320kbps":
        bestQuality = "320";
        musicExtension = ".mp3";
        break;
      case "lossless":
        bestQuality = "m4a";
        break;
    }

    return csnLink.replace(linkRegExp, "/" + bestQuality + "/")
      .replace(/\.[a-zA-Z0-9]+$/, musicExtension);
  }

  chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
    if (message === "toggleCSNPanel") {
      var $toggleElement = $("#nnvsvc-csn-player span.toggle-panel");
      toggleCSNPanel($toggleElement);
    }
  });
});
