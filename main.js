var fs = require('fs')
var pack = require('./pack.js')

var argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .alias('h', 'help')
    .alias('v', 'version')
    .options({
        'list <file>': {
            type: 'string',
            alias: 'l',
            desc: 'list all contents of the file'
        },
        'unpack <file>': {
            type: 'string',
            alias: 'u',
            desc: 'unpack all contents of the file'
        },
        'pack <files..>': {
            type: 'array',
            alias: 'p',
            desc: 'pack all specified files in given order'
        },
        'output <file>': {
            type: 'string',
            alias: 'o',
            desc: 'output destination'
        }

    }
    )
    .wrap(72)
    .argv

if(argv.l != undefined){
    var packentries = pack.list_contents(argv.l)
    console.log(packentries)
}
else if(argv.u != undefined) {
    var packentries = pack.list_contents(argv.u)

    var outputdir = './'

    if(argv.o != undefined) {
        if(!fs.lstatSync(argv.o).isDirectory())
        {
            console.log('invalid output directory')
            return
        }
        outputdir = argv.o + '/'
    }

    packentries.forEach(element=>{
        console.log('unpacking <' +  element.imageName + '>')
        fs.writeFileSync(outputdir+element.imageName, element.imageData)
    })
}
else if(argv.p != undefined) {

    if(argv.o == undefined) {
        console.log('please specify an output destination using --output')
        return
    }

    if(argv.p.length <= 0)
        return
        
    pack.create(argv.p, argv.o)
}

function decimalToHexString(number)
{
  if (number < 0)
  {
    number = 0xFFFFFFFF + number + 1;
  }

  return number.toString(16).toUpperCase();
}