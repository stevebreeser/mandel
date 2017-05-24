import React, { Component, PropTypes } from 'react';
import _ from 'lodash';
import math from 'mathjs';

// We expect n to range from [-2, 2] according to some step increment.
// e.g. [-2, 2] step .1 generates 41 points.
// e.g. [-2, 2] step .05 generates 81 points.
// Map those points to 0 - 800 in both x and y directions
// So,
// -2 => 0,  0 => 400,  2 => 800
//const scaleX = (n) => math.round((n + 2) * 400)
// 2 => 0,  0 => 400,  -2 => 800
//const scaleY = (n) => math.round((-n + 2) * 400)

const scaleX = (n) => math.round((n + 2) * 400)
const scaleY = (n) => math.round((-n + 2) * 400)
const toPixel = (x,y) => ({x: scaleX(x), y: scaleY(y) })

//
// Make a test function which determines whether `c` diverges after
// successively applying the function `f(z) => z*z + c`.
// The test function takes an initial complex number `z' as input.
//
// c:  a complex number
// maxiter:  the maximum number of iterations to test
//
function makeTest(c, maxiter) {
  // R is essentially the point of no return at which point the iterated function
  // will deserve.  Math!
  const calculateR = (c) => ( (1 + math.sqrt(1 + 4*math.abs(c))) / 2 )
  const r = calculateR(c);

  // A complex function that we will repeated iterate.
  // (Really this should be passed in too.)
  //const f = (z) => z*z + c;  // use below to protect from NaN condition
  const f = (z) => math.chain(z).multiply(z).add(c).value;

  return (z) => {
    let arr = [];
    let res = z;
    for (let i=1; i<=maxiter; i++) {
      res = f(res);
      // arr = [res, ...arr];
      arr.push(res);
      if (math.abs(res) > r) {
        return arr;
      }
    }
    return arr;
  }
}

// Return an array of objects comprising interesting points and iter_num
// Interesting points are those that did not diverge below
// some threshold minimum number of iterations (`min_iter_interesting`).
//
function foo(c, box, maxiter, min_iter_interesting) {
  const step = .01;
  const test = makeTest(c, maxiter);
  const {x0, x1, y0, y1} = box;
  const points = _.flatMap(_.range(x0, x1, step), (x) => (
    _.range(y0, y1, step).map((y) => ({x,y}))
  ))

  const modval = math.floor(points.length/20); // just for progress logging
  console.log("number of points: ", points.length);

  const not_boring = points.map(({x,y}, index) => {
      if (0 == (index%modval)) console.log("... processing")
      const arr = (test(math.complex(x,y)));
      return {p: {x,y}, len: arr.length};
    })
    .filter(({p, len}) => len>=min_iter_interesting);

  console.log("not_boring length ", not_boring.length)
  console.log("not_boring[0] ", not_boring[0])
  return not_boring;
}

//
// Returns an array of objects each comprising an interesting point in complex plane
// and the number of iterations that point survived before diverging.
//
function getInterestingPoints() {
  const maxiter = 70; //100
  const min_iter_interesting = 2;  //maxiter-5
  const box = {x0:-2, y0:-2, x1:2.001, y1:2.001};
  const c = math.complex(-.5,-.5); //{x:0, y:1}
  return foo(c, box, maxiter, min_iter_interesting);
}

function pointToPixel({p, len}) {
  let {x,y} = p;
  //console.log("POINT: ", x,y)
  let pixel = toPixel(x,y);
  //console.log(pixel);
  return {pixel, len};
}

// Get interesting points in the Julia Set and convert them into
// an array of interesting pixels to plot.
function getPixelsAndDepths() {
  return getInterestingPoints().map(pointToPixel);
}

// const reducen = (n) => (fn) => (z) => (
//   _.reduce(_.times(n), (acc, val, ind) => ([fn(acc[0]), ...acc]), [z])
// )

const Julia = () => {
  return (
      <div>
        <hr/>
        <DrawingPad />
        <hr/>
      </div>
  )
}

export default Julia

const DrawingPad = () => {
    const pixels = getPixelsAndDepths();

    let getX = ({pixel, len}) => pixel.x
    let getY = ({pixel, len}) => pixel.y
    let getColor = ({pixel, len}) => `#${_.repeat((len), 3)}`  // cheap

    return (
      <div>
        <div
          style={{
            cursor: 'crosshair',
            position: 'fixed',
            top: 120,
            left: 0,
            right: 0,
            bottom: 0,
            WebkitUserSelect: 'none',
            background: '#fff'
          }}
        >
          {pixels.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 10,
                height: 10,
                background: getColor(p),
                left: getX(p),
                top: getY(p) - 120,
                borderRadius: '50%'
              }}
            />
          ))}
        </div>
      </div>
   )
}
