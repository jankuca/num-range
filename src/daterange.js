
( function ( daterange )
{
	/**
	* @class daterange
	*/

	var rangeSortStart = function ( a, b )
	{
		return ( a.start - b.start );
	};

	var rangeSortEnd = function ( a, b )
	{
		return ( a.end - b.end );
	};

	var copyArray = function ( src )
	{
		var copy = [];
		for ( var i = 0; i < src.length; i++ )
		{
			copy.push( src[i] );
		}

		return ( copy );
	};

	var find = function ( array, predicate )
	{
		for ( var i = 0; i < array.length; i++ )
		{
			if ( predicate( array[i] ) )
			{
				return ( array[i] );
			}
		}

		return ( null );
	};

	daterange.equals = function ( range1, range2 )
	{
		if ( !( range1.start instanceof Date ) ||
				!( range2.start instanceof Date ) ||
				!( range1.end instanceof Date ) ||
				!( range2.end instanceof Date ) )
		{
			return range1.start === range2.start && range1.end === range2.end;
		}
		return ( range1.start.getTime() === range2.start.getTime()
					&& range1.end.getTime() === range2.end.getTime() );
	};

	daterange.contains = function ( outer, inner )
	{
		if ( !( outer.start instanceof Date ) ||
				!( inner.start instanceof Date ) ||
				!( outer.end instanceof Date ) ||
				!( inner.end instanceof Date ) )
		{
			return ( !outer.equals( inner )
						&& outer.start <= inner.start
						&& outer.end >= inner.end );
		}
		return ( !outer.equals( inner )
					&& outer.start.getTime() <= inner.start.getTime()
					&& outer.end.getTime() >= inner.end.getTime() );
	};

	daterange.overlaps = function ( range1, range2 )
	{
		if ( !( range1.start instanceof Date ) ||
				!( range2.start instanceof Date ) ||
				!( range1.end instanceof Date ) ||
				!( range2.end instanceof Date ) )
		{
			return ( range1.equals( range2 )
						|| range1.contains( range2 )
						|| range2.contains( range1 )
						|| range1.start < range2.start && range1.end > range2.start
						|| range2.start < range1.start && range2.end > range1.start );
		}
		return ( range1.equals( range2 )
				|| range1.contains( range2 )
				|| range2.contains( range1 )
				|| range1.start.getTime() < range2.start.getTime() && range1.end.getTime() > range2.start.getTime()
				|| range2.start.getTime() < range1.start.getTime() && range2.end.getTime() > range1.start.getTime() );
	};

	daterange.subtract = function ( range1, diffRange )
	{
		if ( range1.equals( diffRange ) || diffRange.contains( range1 ) )
		{
			return ( [] ); //none
		}

		var parts = [daterange.create( range1.start, diffRange.start ), daterange.create( diffRange.end, range1.end )];
		return ( parts.filter( function ( item )
		{
			if ( !( item.start instanceof Date ) || !( item.end instanceof Date ) )
			{
				return ( item.end > item.start );
			}
			return ( item.end.getTime() > item.start.getTime() );
		} ) );
	};

	daterange.create = function ( start, end )
	{
		if ( ( !start || !end ) && start !== 0 && end !== 0 )
		{
			throw new Error( "start and end are required" );
		}

		var me = {
			start: start,
			end: end,
			/**
			 * @method equals
			 * @param {daterange} range2
			 * @return {Boolean}
			 */
			equals: function ( range2 )
			{
				return ( daterange.equals( me, range2 ) );
			},
			/**
			 * @method contains
			 * @param {daterange} inner
			 * @return {Boolean}
			 */
			contains: function ( inner )
			{
				return ( daterange.contains( me, inner ) );
			},
			/**
			 * @method overlaps
			 * @param {daterange} range2
			 * @return {Boolean}
			 */
			overlaps: function ( range2 )
			{
				return ( daterange.overlaps( me, range2 ) );
			},
			/**
			 * @method subtract
			 * @param {daterange} diffRange
			 * @return {Array}
			 */
			subtract: function ( diffRange )
			{
				return( daterange.subtract( me, diffRange ) );
			},
			/**
			 * @method subtract
			 * @param {daterange} range2
			 * @return {Array}
			 */
			add: function ( range2 )
			{
				return ( daterange.sum( [me, range2] ) );
			}
		};

		return ( me );
	};

	/**
	 * @method sum
	 * @param {Array} ranges
	 * @return {Array} ranges
	 */
	daterange.sum = function ( ranges )
	{
		var ordered = ranges.sort( rangeSortStart );
		var orderedRemaining = copyArray( ordered );
		var summed = [];

		var combine = function ( item, index, array )
		{
			var overlappingEnd = find( orderedRemaining, function ( a )
			{
				if ( !( item.start instanceof Date ) || !( item.end instanceof Date ) )
				{
					return ( item.end === a.start || item.overlaps( a ) )
				}
				return ( item.end.getTime() === a.start.getTime() || item.overlaps( a ) )
			} );

			if ( overlappingEnd )
			{
				var newRange = daterange.create( item.start, overlappingEnd.end );

				var overlappingSum =
					summed
					.filter( function ( a )
					{
						if ( !( item.start instanceof Date ) || !( item.end instanceof Date ) )
						{
							return ( a.end === newRange.start || a.overlaps( newRange ) );
						}
						return ( a.end.getTime() === newRange.start.getTime() || a.overlaps( newRange ) );
					} )
					.sort( rangeSortEnd );

				if ( overlappingSum.length )
				{
					if ( overlappingSum[0].end < newRange.end )
					{
						overlappingSum[overlappingSum.length - 1].end = newRange.end;
					}
				}
				else
				{
					summed.push( newRange );
				}
			}
			else
			{
				summed.push( item );
			}

			orderedRemaining = orderedRemaining.slice( 1 );
		};

		for ( var i = 0; i < ordered.length; i++ )
		{
			combine( ordered[i] );
		}

		return ( summed );
	};

	/**
	 * @method inverse
	 * @param {Array} ranges
	 * @return {Array} ranges
	 */
	daterange.inverse = function ( ranges )
	{
		var summed = daterange.sum( ranges );
		var inverse = [];

		if ( summed.length > 1 )
		{
			for ( var i = 1; i < summed.length; i++ )
			{
				inverse.push( daterange.create( summed[i-1].end, summed[i].start ) );
			}
		}

		return ( inverse );
	};

} )( typeof exports === 'undefined' ? this['daterange'] = {} : exports );

