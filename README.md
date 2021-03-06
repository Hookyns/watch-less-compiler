# Automatic LESS compiler
Node.js package which watches less files in given folders and compile them into css.

## Install
```
npm install watch-less-compiler -g
```

## Start watching from cmd
```
watch-less-compiler path/to/your/dir second/path/to/another/dirr and/more/paths
```

Or with glob
```
watch-less-compiler path/**/*.less
```

## Just compile argument
If you want to only compile files without watching, eg. as pre-deploy proces, use --just-compile argument.
```
watch-less-compiler --just-compile path/to/your/dir second/path/to/another/dirr and/more/paths
```

## Using as module
```
const $watch = require("watch-less-compiler");

$watch.watch(["path/to/your/dir", "second/path/to/another/dirr"], function(msg, msgType) {
	// This function is optional parameter. It's just logging callback
	
	if (msgType === $watch.msgType.ERR) {
		console.error(msg);
	} else {
		console.log(msg);
	}
});
```

## How does it work
This package is just one simple script which watches input folders 
and if it detects some changes it will then compile all .less files under given path. 
It not compile just that changed file because given file may be included in another file(s)
and checking this dependencies is quite same as recompile it directly.