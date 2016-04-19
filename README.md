# molmass-calc
Calculates molecular mass of a given compound.  
Demo: http://simeonjmcg.github.io/molmass-calc

## Quick start

	git clone https://github.com/simeonjmcg/molmass-calc.git

Open molmass-calc/index.html in your preferred browser.

## Specifics
Uses JSONP to load molar mass data, paired with a simple javascript callback to load the data.  
Runs input through tokenizer to split into numbers, characters, and parentheses. Also splits in case of upper to lowercase changes, which signals a change in elements. Also allows space seperated chemical names.
Parser then searches for patterns that match chemical formulas. Coefficiants, elements, elements with multipliers, etc. It also parses sub compounds in parentheses (individual ions, typically) recursively.  
Finally, the parsed object is evaluated, summing the mass of each element, as well as building the mathematical representation, as a string.
