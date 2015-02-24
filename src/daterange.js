
var Long = require('long');



( function ( daterange )
{
	/**
	* @class daterange
	*/

	var rangeSortStart = function ( a, b )
	{
		if (Long.isLong(a.start) && Long.isLong(b.start)) {
			return a.start.compare(b.start);
		}
		return ( a.start - b.start );
	};

	var rangeSortEnd = function ( a, b )
	{
		if (Long.isLong(a.end) && Long.isLong(b.end)) {
			return a.end.compare(b.end);
		}
		return ( a.end - b.end );
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
		if ( range1.start instanceof Date &&
				range2.start instanceof Date &&
				range1.end instanceof Date &&
				range2.end instanceof Date )
		{
			return ( range1.start.getTime() === range2.start.getTime()
						&& range1.end.getTime() === range2.end.getTime() );
		}

		if (Long.isLong(range1.start) && Long.isLong(range1.end) &&
				Long.isLong(range2.start) && Long.isLong(range2.end)) {
			return (
				range1.start.equals(range2.start) &&
				range1.end.equals(range2.end)
			);
		}

		return range1.start === range2.start && range1.end === range2.end;
	};

	daterange.contains = function ( outer, inner )
	{
		if ( outer.start instanceof Date &&
				inner.start instanceof Date &&
				outer.end instanceof Date &&
				inner.end instanceof Date )
		{
			return ( !outer.equals( inner )
						&& outer.start.getTime() <= inner.start.getTime()
						&& outer.end.getTime() >= inner.end.getTime() );
		}

		if (Long.isLong(outer.start) && Long.isLong(outer.end) &&
				Long.isLong(inner.start) && Long.isLong(inner.end)) {
			return (
				!outer.equals(inner) &&
				outer.start.lessThanOrEqual(inner.start) &&
				outer.end.greaterThanOrEqual(inner.end)
			);
		}

		return ( !outer.equals( inner )
					&& outer.start <= inner.start
					&& outer.end >= inner.end );
	};

	daterange.overlaps = function ( range1, range2 )
	{
		if ( range1.start instanceof Date &&
				range2.start instanceof Date &&
				range1.end instanceof Date &&
				range2.end instanceof Date )
		{
			return ( range1.equals( range2 )
					|| range1.contains( range2 )
					|| range2.contains( range1 )
					|| range1.start.getTime() < range2.start.getTime() && range1.end.getTime() > range2.start.getTime()
					|| range2.start.getTime() < range1.start.getTime() && range2.end.getTime() > range1.start.getTime() );
		}

		if (Long.isLong(range1.start) && Long.isLong(range1.end) &&
				Long.isLong(range2.start) && Long.isLong(range2.end)) {
			return (
				range1.equals(range2) ||
				range1.contains(range2) ||
				range2.contains(range1) ||
				range1.start.lessThan(range2.start) && range1.end.greaterThan(range2.start) ||
				range2.start.lessThan(range1.start) && range2.end.greaterThan(range1.start)
			);
		}

		return ( range1.equals( range2 )
					|| range1.contains( range2 )
					|| range2.contains( range1 )
					|| range1.start < range2.start && range1.end > range2.start
					|| range2.start < range1.start && range2.end > range1.start );
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
			if ( item.start instanceof Date && item.end instanceof Date )
			{
				return ( item.end.getTime() > item.start.getTime() );
			}

			if (Long.isLong(item.start) && Long.isLong(item.end)) {
				return item.end.greaterThan(item.start);
			}

			return ( item.end > item.start );
		} ) );
	};

	daterange.create = function ( start, end )
	{
		if ((!start || !end) && start !== 0 && end !== 0) {
			throw new Error( "start and end are required" );
		}

		if (Long.isLong(start)) {
			start = start.toString();
		}
		if (Long.isLong(end)) {
			end = end.toString();
		}

		var me = {
			start: (typeof start === 'string') ? Long.fromString(start) : start,
			end: (typeof end === 'string') ? Long.fromString(end) : end,
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
		var ordered = ranges.sort(rangeSortStart);
		var orderedRemaining = ordered.slice();
		var summed = [];

		var combine = function ( item ) {
			var overlappingEnd = find(orderedRemaining, function (a) {
				if (item.overlaps(a)) {
					return true;
				}
				if (item.end instanceof Date && a.start instanceof Date) {
					return (item.end.getTime() === a.start.getTime());
				}
				if (Long.isLong(item.end) && Long.isLong(a.start)) {
					return item.end.equals(a.start);
				}
				return (item.end === a.start);
			});

			if (overlappingEnd) {
				var newRange = daterange.create(item.start, overlappingEnd.end);

				var overlappingSum = summed.filter(function (a) {
					if (a.overlaps(newRange)) {
						return true;
					}
					if (a.end instanceof Date && newRange.start instanceof Date) {
						return (a.end.getTime() === newRange.start.getTime());
					}
					if (Long.isLong(a.end) && Long.isLong(newRange.start)) {
						return a.end.equals(newRange.start);
					}
					return (a.end === newRange.start);
				});

				if (overlappingSum.length) {
					overlappingSum.sort(rangeSortEnd);

					if (Long.isLong(overlappingSum[0].end) &&
							Long.isLong(newRange.end)) {
						if (overlappingSum[0].end.lessThan(newRange.end)) {
							overlappingSum[overlappingSum.length - 1].end = newRange.end;
						}
					} else {
						if (overlappingSum[0].end < newRange.end) {
							overlappingSum[overlappingSum.length - 1].end = newRange.end;
						}
					}
				} else {
					summed.push(newRange);
				}
			} else {
				summed.push(item);
			}

			orderedRemaining = orderedRemaining.slice(1);
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

