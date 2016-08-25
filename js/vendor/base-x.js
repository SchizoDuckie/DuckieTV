/*
 * base-x encoding
 * Forked from https://github.com/cryptocoinjs/bs58
 * Originally written by Mike Hearn for BitcoinJ
 * Copyright (c) 2011 Google Inc
 * Ported to JavaScript by Stefan Thomas
 * Merged Buffer refactorings from base58-native by Stephen Pair
 * Copyright (c) 2013 BitPay Inc
 * Copyright base-x contributors (c) 2016
 * Ported and modified from npm module by garfield69 from https://github.com/cryptocoinjs/base-x
 * released under the MIT license.
*/
;(function(){

    var base16 = '0123456789ABCDEF';
    var base32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    function basex(alphabet) {
      var alphabetMap = {};
      var base = alphabet.length;
      var leader = alphabet.charAt(0);

      // pre-compute lookup table
      for (var i = 0; i < alphabet.length; i++) {
        alphabetMap[alphabet.charAt(i)] = i;
      }

      function encode(source) {
        if (source.length === 0) {
            return '';
        }

        var digits = [0];
        for (var i = 0; i < source.length; ++i) {
          for (var j = 0, carry = source[i]; j < digits.length; ++j) {
            carry += digits[j] << 8;
            digits[j] = carry % base;
            carry = (carry / base) | 0;
          }

          while (carry > 0) {
            digits.push(carry % base);
            carry = (carry / base) | 0;
          }
        }

        var string = '';

        // deal with leading zeros
        for (var k = 0; source[k] === 0 && k < source.length - 1; ++k) {
            string += alphabet[0];
        }
        // convert digits to a string
        for (var q = digits.length - 1; q >= 0; --q) {
            string += alphabet[digits[q]];
        }

        return string;
      }

      function decode(string) {
        if (string.length === 0) {
            return [];
        }

        var bytes = [0];
        for (var i = 0; i < string.length; i++) {
          var value = alphabetMap[string[i]];
          if (value === undefined) {
              throw new Error('Non-base' + base + ' character [' + string[i] + ']');
          }

          for (var j = 0, carry = value; j < bytes.length; ++j) {
            carry += bytes[j] * base;
            bytes[j] = carry & 0xff;
            carry >>= 8;
          }

          while (carry > 0) {
            bytes.push(carry & 0xff);
            carry >>= 8;
          }
        }

        // deal with leading zeros
        for (var k = 0; string[k] === leader && k < string.length - 1; ++k) {
          bytes.push(0);
        }

        return bytes.reverse();
      }

      return {
        encode: encode,
        decode: decode
      }
    }
    window.basex16 = basex(base16);
    window.basex32 = basex(base32);

})();
