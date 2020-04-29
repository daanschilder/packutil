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
    
    packentries.forEach(function(value, number, array) {
        value.imageInfo = get_electrified3_image_info_by_image(value.imageData)
    })

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

function bytearray_readInt32(bytearray, offset) {
    var bytes = bytearray.slice(offset, offset + 4)
    return (bytes[3] << 24)  | (bytes[2] << 16)  | (bytes[1] << 8) | bytes[0]
}

function get_electrified3_image_info_by_image(image_bytearray) {
    var hexstring = decimalToHexString(bytearray_readInt32(image_bytearray, 0))

    var imageInfo = {}

    if(hexstring == 'AA55AA55') {
        if(image_bytearray[4] == 0xF4)
        {
            imageInfo.type = 'main'
            imageInfo.version = image_bytearray[7] + '.' + image_bytearray[6] + '.' + image_bytearray[5]
            return imageInfo;
        }
        if(image_bytearray[4] == 0xA1)
        {
            imageInfo.type = 'motor'
            imageInfo.version = image_bytearray[7] + '.' + image_bytearray[6] + '.' + image_bytearray[5]
            return imageInfo;
        }        
    }

    else if(hexstring == '2044414F')
    {
        imageInfo.type = 'BLE'
        imageInfo.version = image_bytearray[33] + '.' + image_bytearray[34] + '.' + image_bytearray[35]
        return imageInfo
    }
}