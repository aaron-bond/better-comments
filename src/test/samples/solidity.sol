pragma solidity ^0.6.0;

// Regular single-line comment
/// Natspec single-line comment

/*
  Regular
  Multi-line
  Comment
  TODO: Create some copyright notes
 */

/**
  Natspec
  Multi-line
  Comment
 */

contract Test {
    // Regular single-line comment
    address addr;

    /**
     * My Function
     * ! Some Alert
     * TODO Some stuff
     * ?  Questions
     * * Highlights
     */

    function foo(address _addr) public {
        /// Natspec single-line comment
        require(msg.sender == addr);
        addr = _addr;
        //// removed code
    }

    // ! Need more content here
}

// * End of the file
