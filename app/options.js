document.addEventListener('DOMContentLoaded', initialSetup);

function initialSetup() {
	$("#fucktimkuik").on("click", findAndTestMirror);
	$("#testSearch").on("click", testSearch);
	$("#save").on("click", saveSettings);
    $("#searchmirror").on("keypress", resetTest);
    $("#searchmirror").on("change", resetTest);

    $("#searchmirror").val(localStorage.getItem("search.mirror"));
    if(localStorage.getItem("search.720p") === '1') {
		$("input[name='search.720p']").attr('checked', true);
	}
    $("input[name='notify.type'][value='"+localStorage.getItem("notify.type")+"']").attr('checked', true);
    $("input[name='update.frequency'][value='"+localStorage.getItem("update.frequency")+"']").attr('checked', true);
}

function saveSettings() {
	testSearch(function(result) {				// we pass a callback to testSearch It will return true or false.
		if(result === true) {					// only save everything if the search mirror has been set properly.
			localStorage.setItem("search.mirror", $("#searchmirror").val());
			localStorage.setItem("search.720p", $("input[name='search.720p']").attr("checked") === true ? "1" : "0");
			localStorage.setItem("notify.type", $("input[name='notify.type']:checked").val());
			localStorage.setItem("update.frequency", $("input[name='update.frequency']:checked").val());
			$("#save").attr("Value", "Saved!");
		} else {
			$("#save").attr("Value", "Settings NOT saved!");
		}
	});
}

function resetTest() {
	$("#testSearch").attr("value", "test");
	$("#testSearch").attr("class", "");
}


function findAndTestMirror() {
	fuckTimKuik(function(newUrl) {
			$('#searchmirror').val(newUrl);
            testSearch();
	});
}

/**
 * Perform a test search to verify that we have a working TPB mirror.
 */
function testSearch(cb) {
	$("#testSearch").attr("value", "Testing...");
    $.ajax({
        url: $("#searchmirror").val()+"search/the+pirate+bay/0/7/0/",  /* tpb search, ordered by seeds */
        complete: function (xhr) {
            var row = $(xhr.response).find('#searchResult tbody tr');
            $("#testSearch").attr("value", (row.length > 0) ? "OK!" : "ERROR!");
			$("#searchmirror").attr("class", (row.length > 0) ? "OK" : "NOK");
			if(cb && typeof(cb) === "function") cb(row && row.length > 0);
        }
    });
}

