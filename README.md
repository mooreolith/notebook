# notebook

[notebook](https://mooreolith.github.io/notebook) is (very) simple jupyter inspired notebook for client side javascript. Enter some javascript code in a cell, and hit "Run Cell" to execute it. The cell itself is an async function, so if you return a value or return await a value, the output below will show that value. 

The return value types treated with special consideration are:
* strings: gets displayed, without quotes
* objects, arrays: get pretty printed, 2 spaces. If that's not desired, use return JSON.stringify(...).
* HTML elements: get appended to the output element below the cell.

Besides the return values, there are three variabels that notebook makes available to the code in the cells:
* output: the current cell's .output div
* cell: a reference to the current cell section element.
* notebook: a reference to the current article element.

You can treat them as any other HTML element, appendChild, set innerHTML, and so on. It is possible to load external libraries using **lib = await import("...");**. 