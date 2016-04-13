var elementList = [],
    input       = $("#input"), 
    output      = $("#output"), 
    show        = $("#show"),
    clear       = $("#clear"),
    elements    = $(".element");

// Get jsonp data
function jsonpCallback(data) {
  elementList = data;
}

input.on("input", function(e){
  var inputStr = input.val(),
      outputStr;
    
    try {
      // get output from evaluating string with elementList
    outputev = chem.strEval(inputStr,elementList);
    
    //ensure correct result
    if(outputev == null || isNaN(outputev["value"])) {
      output.text("(invalid equation)");
    } else {
      // round output
      var out = Math.round(outputev["value"] * 1e5)/1e5;
      
      // output equation if show is checked, otherwise output plain result
      if(show.prop("checked")) {
        output.text(outputev["equation"] + " = " + out);
      } else {
        output.text(out);
      }
    }
  } catch(e) { // catch result, and handle user exceptions
    if(e.message != null && e.name == "UserException") {
      output.text("(" + e.message + ")");
    } else {
      console.error(e);
    }
  }
});

// clear input
clear.click(function(e) {
  input.val("");
});

// register changes when checkbox changes
show.change(function(e) {
  input.trigger("input");
});

// handle button responses
elements.click(function(e) {
  var start = input.get(0).selectionStart;
  var end = input.get(0).selectionEnd;
  var text = $(this).attr("value");
  // set input val to current val, with new symbol from table buttons
  input.val(input.val().substring(0, start) +
      text + input.val().substring(end));

  // put caret at right position again
  input.get(0).selectionStart =
      input.get(0).selectionEnd = start + text.length;
  // register changes when added
  input.trigger("input");
});
