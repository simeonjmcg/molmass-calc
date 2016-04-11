function UserException(message) {
   this.message = message;
   this.name = "UserException";
   this.toString = function() {
      return "[" + this.name + "]: " + this.message;
   };
}

// Takes string and lexes it into tokens
function tokenizechem(str) {
	if(str == null || str == "") {
		throw new UserException("Invalid input");
	}
	var tokens = [],
		type, val,
	    i;
	for(i in str) {
		var tmptype = null, // current type of ch
		    ch = str.charCodeAt(i); // character integer code
		
		if((ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122)) { // 'A' <= ch <= 'Z' || 'a' <= ch <= 'z'
			tmptype = "NAME";
		} else if(ch >= 48 && ch <= 57) { // '0' <= ch <= '9'
			tmptype = "NUMBER";
		} else if(ch == 40) { // ch == '('
			tmptype = "OPAREN";
		} else if(ch == 41) { // ch == ')'
			tmptype = "CPAREN";
		}
		
		// if type changed, terminate current token and start a new token
		if(tmptype != type && type != null) {
			tokens.push({
				"type": type,
				"value": val
			});
			val = null;
		}
		
		// set values based of of type detected
		switch(tmptype) {
			case "NAME":
				if(val == null) {
					val = "";
				}
				if(tmptype == type && ch >= 65 && ch <= 90) { 
					// if continuing chars are upper case, start new token
					tokens.push({
						"type": type,
						"value": val
					});
					val = "";
				}
				val += str.charAt(i);
				break;
			case "OPAREN":
			case "CPAREN":
				// Start new token for each parenthesis
				if(tmptype == type) {
					tokens.push({
						"type": type,
						"value": val
					});
				}
				val = str.charAt(i);
				break;
			case "NUMBER":
				if(val == null) {
					val = 0;
				}
				// char code to integer conversion
				val = val * 10 + (ch - 48);
				break;
		}
		// set type to tmptype for next round
		type = tmptype;
	}
	// finalize last token
	if(type != null) {
		tokens.push({
			"type": type,
			"value": val
		});
	}
	return tokens;
}

function parsechem(tokens, idx) {
	if(tokens == null) {
		throw new UserException("invalid tokens input");
	}
	// coefficiant is of course the number of said molecule. Prefix, rather than the typical prefix
	var chemformula = {
		"coefficiant": 1,
		"chems": []},
	    i, l;
	// if idx is unspecified, assume 0.
	if(idx == null) {
		idx = 0;
	}
	// loop through tokens
	for(i = idx, l = tokens.length; i < l; i++) {
	
		if(i == 0 && tokens[i]["type"] == "NUMBER") { // if "$[num]"
			// assign number as coefficiant
			chemformula["coefficiant"] = tokens[i]["value"];
		} else if(tokens[i]["type"] == "NAME" && 
		          tokens[i+1] != null && tokens[i+1]["type"] == "NUMBER") { // if "[name][num]"
		    // add element with symbol and number
			chemformula["chems"].push({
				"chem": tokens[i]["value"],
				"num": tokens[i+1]["value"]
			});
			i++; // skip double token(name and num)
		} else if(tokens[i]["type"] == "NAME") { // if "[name]"
			// add element with symbol, and the implied number of 1
			chemformula["chems"].push({
				"chem": tokens[i]["value"],
				"num": 1
			});
		} else if(tokens[i]["type"] == "OPAREN") { // if "("
			// recursively parse values within parenthesis
			var c = parsechem(tokens, i+1);
			// add entire object as single chem element
			chemformula["chems"].push({
				"chem": c["chem"],
				"num": c["num"]
			});
			// if result is missing idx, that is, if it finishes without finding closing parenthesis
			if(c["idx"] == null) {
				throw new UserException("Missing closing parenthesis");
			}
			// skip to the end of parenthesis
			i = c["idx"];
		} else if(tokens[i]["type"] == "CPAREN") { // if ")"
		    // if idx hasn't been passed, meaning function hasn't recursed
			if(idx == 0) {
				throw new UserException("Missing opening parenthisis");
			}
			var num = 1, 
			    inc = 1;
			// if parenthesis followed by number, save as number and skip parenthesis and number
			if(tokens[i+1] != null && tokens[i+1]["type"] == "NUMBER") { 
				num = tokens[i+1]["value"];
				inc = 2;
			}
			return {"chem": chemformula, "num": num, "idx": i+inc};
		} else { // no correct patterns found, must be error.
			throw new UserException("Syntax error");
		}
	}
	return {"chem": chemformula, "num": 1};
}

// recursive function, mathematically evaluate chemical data
function evalchem(chem, elist) {
	// ensure chem exists, and has data
	if(chem == null || chem["chems"] == null) {
		throw new UserException("Invalid chem input");
	}
	// check for a molar mass list
	if(elist == null) {
		throw new UserException("invalid element list input");
	}
	
	var total = 0,
		eqstr = "",
	    i;
	
	// loop through chemicals
	for(i in chem["chems"]) {
		var c = chem["chems"][i];
		// add " + " between amounts
		if(i > 0) {
			eqstr += " + ";
		}
		// if chem is a symbol
		if(typeof c["chem"] == "string") {
		
			// add to total, and concatenate to equation string. symbol not case sensitive
			total += elist[c["chem"].toLowerCase()] * chem["coefficiant"] * c["num"];
			
			eqstr += elist[c["chem"].toLowerCase()];
			// add number, only if not the emplied 1
			if(c["num"] != 1) {
				eqstr += " * " + c["num"];
			}
		} else if(typeof c["chem"] == "object") {
			// recursively calculate subchemical.
			//add to total, and concatenate to equation string
			var ev = evalchem(c["chem"], elist);
			total += ev["val"] * chem["coefficiant"] * c["num"];
			
			eqstr += "(" + ev["eq"] + ")";
			// add number, only if not the emplied 1
			if(c["num"] != 1) {
				eqstr += " * " + c["num"];
			}
		} else {
			// Invalid input of some sort
			throw new UserException("Invalid chem input");
		}
	}
	// add coefficiant calculation to string, so long as it isn't the implied 1
	if(chem["coefficiant"] != 1) {
		eqstr = chem["coefficiant"] + " * (" + eqstr + ")";
	}
	// if value is nothing, set eqstr to 0
	if(eqstr == "") {
		eqstr = "0";
	}
	return {"val": total, "eq": eqstr};
}

// exported function that takes a string and molar mass list, and returns both value, and equation string
function chemstreval(str, elist) {
	// ensure string exists
	if(str == null) {
		throw new UserException("Invalid string input");
	}
	// check for a molar mass list
	if(elist == null) {
		throw new UserException("invalid element list input");
	}
	var tok = tokenizechem(str);
	var chem = parsechem(tok);
	
	// ensure chem parsed correctly
	if(chem == null) {
		throw new UserException("no chemicals parsed");
	}
	return evalchem(chem["chem"],elist);
}
