# Automatic LESS compiler
Node.js package which watches less files in given folders and compile them into css.

## Install
```
npm install watch-less-compiler -g
```

## Start watching
```
watch-less-compiler path/to/your/dir second/path/to/another/dirr and/more/paths
```

## How does it work
This package is just one simple script which watches input folders 
and if it detects some changes it will then compile all .less files under given path. 
It not compile just that changed file because given file may be included in another file(s)
and checking this dependencies is quite same as recompile it directly.