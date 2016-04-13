/**
 *
 */

var chem = {};

/**
 * Custom exception for messages to the user.
 * @param {string} message.
 * @constructor
 */
chem.UserException = function (message) {
  /**
   * @type {string}
   * @public
   */
  this.message = message;
  /**
   * @type {string}
   * @public
   */
   this.name = 'UserException';
}

/**
 * @return {string}
 * @public
 */
chem.UserException.prototype.toString = function() {
  return '[' + this.name + ']: ' + this.message;
};

/** 
 * Specifies type of token, used by chem.Token class.
 * @enum {string}
 */
chem.TokenType = {
  NAME: 'name',
  NUMBER: 'number',
  OPAREN: 'open paren',
  CPAREN: 'close paren'
};

/**
 * string token class, used by the tokenizer and parser
 * @param {chem.TokenType} type
 * @param {string|number}  value
 * @constructor
 * @struct
 */
chem.Token = function(type, value) {
  /**
   * @type {chem.TokenType}
   * @public
   */
  this.type = type;
  /**
   * @type {string|number}
   * @public
   */
  this.value = value;
};

/**
 * @return {string}
 * @public
 */
chem.Token.prototype.toString = function() {
  return 'chem.Token(' + this.type + ', ' + this.val + ')';
};

/**
 * Describes individual chemicals from the periodic table, 
 * or entire subcompounds of class chem.Compound
 * @param {string|Object} chemical Chemical symbol, or chem.Compound object 
 *     for submolecules
 * @param {number}        value
 * @constructor
 * @struct
 */
chem.Chemical = function(chemical, value) {
  /**
   * Chemical symbol, or chem.Compound object for submolecules
   * @type {string|Object}
   * @public
   */
  this.chemical = chemical;
  
  /**
   * Number of molecules described
   * @type {number}
   * @public
   */
  this.value = value;
};

/**
 * Describes compound chemicals, composed of chem.Chemical objects with a 
 * coefficiant multiplier
 * @param {number}         coefficiant
 * @param {Array.<Object>} chemicals
 * @constructor
 * @struct
 */
chem.Compound = function(coefficiant, chemicals) {
  /**
   * @type {number}
   * @public
   */
  this.coefficiant = coefficiant;
  
  /**
   * @type {Array.<Object>}
   * @public
   */
  this.chemicals = chemicals;
};

/** 
 * Takes string and lexes it into tokens
 * @param {string} str
 * @return {Array.<Object>}
*/
chem.tokenize = function (str) {
  if(!str) {
    throw new chem.UserException('Invalid input');
  }
  var tokens = [],
      type, val,
      l;
  l = str.length;
  for(var i=0; i<l; i++) {
    var t = null, // current type of character
        ch = str.charCodeAt(i); // character integer code
    
    if((ch >= 65 && ch <= 90) || (ch >= 97 && ch <= 122)) {                    
      // 'A' <= ch <= 'Z' || 'a' <= ch <= 'z'
      t = chem.TokenType.NAME;
    } else if(ch >= 48 && ch <= 57) { 
      // '0' <= ch <= '9'
      t = chem.TokenType.NUMBER;
    } else if(ch == 40) { 
      // ch == '('
      t = chem.TokenType.OPAREN;
    } else if(ch == 41) { 
      // ch == ')'
      t = chem.TokenType.CPAREN;
    }
    
    // if type changed, terminate current token and start a new token
    if(t != type && type != null) {
      tokens.push(new chem.Token(type, val));
      val = null;
    }
    // set values based of of type detected
    switch(t) {
      case chem.TokenType.NAME:
        if(val == null) {
          val = '';
        }
        if(t == type && ch >= 65 && ch <= 90) { 
          // if continuing chars are upper case, start new token
          tokens.push(new chem.Token(type, val));
          val = '';
        }
        val += str.charAt(i);
        break;
      case chem.TokenType.OPAREN:
      case chem.TokenType.CPAREN:
        // Start new token for each parenthesis
        if(t == type) {
          tokens.push(new chem.Token(type, val));
        }
        val = str.charAt(i);
        break;
      case chem.TokenType.NUMBER:
        if(val == null) {
          val = 0;
        }
        // char code to integer conversion
        val = val * 10 + (ch - 48);
        break;
    }
    // set type to t for next round
    type = t;
  }
  // finalize last token
  if(type != null) {
    tokens.push(new chem.Token(type, val));
  }
  return tokens;
};

/**
 * Parse tokens into a chem.Chemical object
 * @param {Array.<Object>} tokens
 * @param {number}         idx    starting index, used for recursion.
 * @return {Object.<string, (Object|number)>}
 */
chem.parse = function (tokens, idx) {
  if(!tokens) {
    throw new chem.UserException('invalid tokens input');
  }
  
  var compound = new chem.Compound(1,[]);
  if(!idx) {
    idx = 0;
  }
  
  var l = tokens.length;
  for(var i = idx; i < l; i++) {
  
    if(i == 0 && tokens[i].type == chem.TokenType.NUMBER) { 
        // if '$[num]'
      
      compound.coefficiant = tokens[i].value;
      
    } else if(tokens[i].type == chem.TokenType.NAME && 
          tokens[i+1] != null && tokens[i+1].type == chem.TokenType.NUMBER) {
          // if '[name][num]'
      
      compound.chemicals.push(
          new chem.Chemical(tokens[i].value,tokens[i+1].value));
      
      i++; // skip double token(name and num)
      
    } else if(tokens[i].type == chem.TokenType.NAME) {
        // if '[name]'
      
      compound.chemicals.push(
          new chem.Chemical(tokens[i].value,1));
      
    } else if(tokens[i].type == chem.TokenType.OPAREN) {
        // if '('
      
      // recursively parse values within parenthesis
      var c = chem.parse(tokens, i+1);
      
      compound.chemicals.push(
          new chem.Chemical(c['chemical'], c['value']));
      
      // idx is null if no closing paren is found
      if(!c['idx']) {
        throw new chem.UserException('Missing closing parenthesis');
      }
      
      i = c['idx'];
    } else if(tokens[i].type == chem.TokenType.CPAREN) {
        // if ')'
        
      // idx is 0 or null if funcition hasn't recursed
      if(!idx) {
        throw new chem.UserException('Missing opening parenthisis');
      }
      var value = 1, 
          inc = 1;
      
      if(tokens[i+1] != null && tokens[i+1].type == chem.TokenType.NUMBER) { 
        value = tokens[i+1].value;
        inc = 2;
      }
      
      return {'chemical': compound, 'value': value, 'idx': i+inc};
    } else {
      throw new chem.UserException('Syntax error');
    }
  }
  return {'chemical': compound, 'value': 1, 'idx': null};
};


/**
 * Mathematically evaluate chemical data from chem.Compound object.
 * @param {Object} compound
 * @param {Object.<string,number>} massDict
 * @return {Object.<string, (Object|number)>}
 */
chem.evaluate = function (compound, massDict) {
  if(compound == null || compound.chemicals == null) {
    throw new UserException('Invalid compound input');
  }
  if(massDict == null) {
    throw new chem.UserException('invalid element list input');
  }
  
  var total = 0,
    equation = '',
      l;
  
  // loop through chemicals
  l = compound.chemicals.length;
  for(var i=0; i<l; i++) {
    var c = compound.chemicals[i];
    // add ' + ' between amounts
    if(i > 0) {
      equation += ' + ';
    }
    // if chem is a symbol
    if(typeof c.chemical == 'string') {
      var symbol = c.chemical.toLowerCase();
      // symbol not case sensitive
      if(!(symbol in massDict)) {
        throw new chem.UserException("Chemical symbol not recognized");
      }
      
      total += massDict[symbol] * compound.coefficiant * c.value;
      
      equation += massDict[symbol];
      if(c.value != 1) {
        equation += ' * ' + c.value;
      }
    } else if(typeof c.chemical == 'object') {
      // recursively calculate subcompound.
      var subcompound = chem.evaluate(c.chemical, masslist);
      total += subcompound['value'] * compound.coefficiant * c.value;
      
      equation += '(' + subcompound['equation'] + ')';
      if(c['num'] != 1) {
        equation += ' * ' + c['num'];
      }
    } else {
      throw new chem.UserException('Invalid chem input');
    }
  }
  if(compound.coefficiant != 1) {
    equation = compound.coefficiant + ' * (' + equation + ')';
  }
  if(!equation) {
    equation = '0';
  }
  return {'value': total, 'equation': equation};
};

/**
 * Takes a string and mass dictionary, and tokenizes, parses, then evaluates it.
 * @param {string} str Input string to be evaluated.
 * @param {Objects.<string, number>} massDict Molar mass dictionary.
 * @return 
 */
chem.strEval = function (str, massDict) {
  if(str == null) {
    throw new chem.UserException('Invalid string input');
  }
  if(massDict == null) {
    throw new chem.UserException('invalid element list input');
  }
  var token = chem.tokenize(str);
  var compound = chem.parse(token);
  
  if(compound == null) {
    throw new chem.UserException('no chemicals parsed');
  }
  return chem.evaluate(compound['chemical'],massDict);
};
