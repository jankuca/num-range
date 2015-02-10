var assert = require( "assert" );
var numrange = require( "../index.js" );

/**
 * Mocha tests
 */

describe( 'numrange', function ()
{
  var first = 20000001;
  var second = 20000002;
  var third = 20000003;
  var fourth = 20000004;

  var firstX = 20000001;
  var secondX = 20000002;
  var thirdX = 20000003;
  var fourthX = 20000004;

  var testRanges = {};
  testRanges.first = {};
  testRanges.second = {};
  testRanges.third = {};
  testRanges.fourth = {};
  testRanges.fifth = {};
  // these two overlap
  testRanges.first.start = 20000601;
  testRanges.first.end = 20010001;
  testRanges.second.start = 20000901;
  testRanges.second.end = 20010301;
  testRanges.third.start = 20010001;
  testRanges.third.end = 20010601;
  // these do not overlap
  testRanges.fourth.start = 20020601;
  testRanges.fourth.end = 20030601;
  testRanges.fifth.start = 20040001;
  testRanges.fifth.end = 20040601;

  it( 'should require start/end', function ( done )
  {
    assert.throws( function () { numrange.create() } );
    assert.throws( function () { numrange.create( 20020101 ) } );
    assert.throws( function () { numrange.create( null, 20020101 ) } );
    done();
  } );

  it( 'should have equals', function ( done )
  {
    assert( numrange.create( first, second ).equals( numrange.create( firstX, secondX ) ) );
    assert( !numrange.create( first, second ).equals( numrange.create( firstX, thirdX ) ) );
    done();
  } );

  it( 'should have contains', function ( done )
  {
    assert( numrange.create( first, third ).contains( numrange.create( firstX, secondX ) ) );
    assert( !numrange.create( first, second ).contains( numrange.create( firstX, thirdX ) ) );
    done();
  } );

  it( 'should have overlaps', function ( done )
  {
    var otherStart = 20000101;
    var otherEnd = 20000102;

    assert( numrange.create( first, third ).overlaps( numrange.create( firstX, secondX ) ) );
    assert( numrange.create( first, second ).overlaps( numrange.create( firstX, thirdX ) ) );
    assert( !numrange.create( first, second ).overlaps( numrange.create( otherStart, otherEnd ) ) );
    assert( !numrange.create( first, second ).overlaps( numrange.create( secondX, thirdX ) ) );
    done();
  } );


  it( 'should have simple subtract', function ( done )
  {
    var diff = numrange.create( first, third ).subtract( numrange.create( firstX, secondX ) );

    assert( diff.length === 1 );
    assert( diff[0].start === second );
    assert( diff[0].end === third );
    done();
  } );

  it( 'should have simple add', function ( done )
  {
    var sum = numrange.create( first, third ).add( numrange.create( firstX, secondX ) );

    assert( sum.length === 1 );
    assert( sum[0].start === first );
    assert( sum[0].end === third );
    done();
  } );

  it( 'should have simple add with broken ranges', function ( done )
  {
    var sum = numrange.create( first, second ).add( numrange.create( third, fourth ) );

    assert( sum.length === 2 );
    assert( sum[0].start === first );
    assert( sum[0].end === second );
    assert( sum[1].start === third );
    assert( sum[1].end === fourth );
    done();
  } );

  it( 'should have empty subtract when nothing to return', function ( done )
  {
    var diff = numrange.create( second, third ).subtract( numrange.create( firstX, thirdX ) );

    assert( diff.length === 0 );
    done();
  } );

  it( 'should have 2 results from subtract when splitting', function ( done )
  {
    var diff = numrange.create( first, fourth ).subtract( numrange.create( secondX, thirdX ) );

    assert( diff.length === 2 );
    assert( diff[0].start === first );
    assert( diff[0].end === second );
    assert( diff[1].start === third );
    assert( diff[1].end === fourth );
    done();
  } );

  it( 'should sum empty ranges', function ( done )
  {
    var sum = numrange.sum( [] );

    assert( sum.length === 0 );
    done();
  } );

  it( 'should sum continuous ranges', function ( done )
  {
    var sum = numrange.sum( [numrange.create( first, second ), numrange.create( second, third ), numrange.create( second, fourth )] );

    assert( sum.length === 1 );
    assert( sum[0].start === first );
    assert( sum[0].end === fourth );
    done();
  } );

  it( 'should sum broken up ranges', function ( done )
  {
    var sum = numrange.sum( [numrange.create( first, second ), numrange.create( third, fourth ), numrange.create( fourth, fourth )] );

    assert( sum.length === 2 );
    assert( sum[0].start === first );
    assert( sum[0].end === second );
    assert( sum[1].start === third );
    assert( sum[1].end === fourth );
    done();
  } );

  it( 'should sum forward broken ranges', function ( done )
  {
    var ranges = [];

    for ( var i = 1; i < 11; i++ )
    {
      ranges.push( numrange.create( 20000000 + i * 3, 20000000 + i * 3 + 1 ) );
    }
    var sum = numrange.sum( ranges );

    assert( sum.length === 10, sum.length );
    done();
  } );

  it( 'should sum a large continuous forward range', function ( done )
  {
    var ranges = [];

    for ( var i = 1; i < 2000; i++ )
    {
      ranges.push( numrange.create( 20000000 + i, 20000000 + i * 2 ) );
    }
    var sum = numrange.sum( ranges );

    assert( sum.length === 1, sum.length );
    done();
  } );

  it( 'should sum a backward continuous range', function ( done )
  {
    var ranges = [];

    for ( var i = 10; i > 1; i-- )
    {
      ranges.push( numrange.create( 20000000 + i, 20000000 + i * 2 ) );
    }
    var sum = numrange.sum( ranges );

    assert( sum.length === 1, sum.length );
    done();
  } );

  it( 'should inverse empty ranges', function ( done )
  {
    var inverse = numrange.inverse( [] );

    assert( inverse.length === 0 );
    done();
  } );

  it( 'should inverse continuous ranges', function ( done )
  {
    var inverse = numrange.inverse( [ numrange.create( testRanges.third.start, testRanges.third.end ), numrange.create( testRanges.first.start, testRanges.first.end ), numrange.create( testRanges.second.start, testRanges.second.end )] );

    assert( inverse.length === 0 );
    done();
  } );

  it( 'should inverse broken up ranges', function ( done )
  {
    var inverse = numrange.inverse( [numrange.create( testRanges.first.start, testRanges.first.end ), numrange.create( testRanges.fourth.start, testRanges.fourth.end )] );

    assert( inverse.length === 1 );
    assert( inverse[0].start === testRanges.first.end );
    assert( inverse[0].end === testRanges.fourth.start );
    done();
  } );

  it( 'should inverse continuous and broken up ranges', function ( done )
  {
    var inverse = numrange.inverse( [ numrange.create( testRanges.fifth.start, testRanges.fifth.end), numrange.create( testRanges.third.start, testRanges.third.end ), numrange.create( testRanges.first.start, testRanges.first.end ), numrange.create( testRanges.second.start, testRanges.second.end ), numrange.create( testRanges.fourth.start, testRanges.fourth.end )] );

    assert( inverse.length === 2 );
    assert( inverse[0].start === testRanges.third.end );
    assert( inverse[0].end === testRanges.fourth.start );
    assert( inverse[1].start === testRanges.fourth.end );
    assert( inverse[1].end === testRanges.fifth.start );
    done();
  } );

  it( 'should inverse a large continuous forward range', function ( done )
  {
    var ranges = [];

    for ( var i = 1; i < 2000; i++ )
    {
      ranges.push( numrange.create( 20000000 + i, 20000000 + i * 2 ) );
    }
    var inverse = numrange.inverse( ranges );

    assert( inverse.length === 0 );
    done();
  } );

  it( 'should inverse many broken up ranges', function ( done )
  {
    var ranges = [];

    for ( var i = 0; i < 500; i++ )
    {
      ranges.push( numrange.create( (2000+i) * 10000 + 1, (2000+i) * 10000 + 6 ) );
    }
    var inverse = numrange.inverse( ranges );

    assert( inverse.length === ( i - 1 ) );
    done();
  } );

} );
