var fs = require('fs')
var path = require('path')

function bytearray_readInt32(bytearray, offset) {
    var bytes = bytearray.slice(offset, offset + 4)
    return (bytes[3] << 24)  | (bytes[2] << 16)  | (bytes[1] << 8) | bytes[0]
}

function bytearray_fromInt32(int32) {
    var buffer = new Uint8Array(4)
    buffer[0] = int32 & 0xFF
    buffer[1] = (int32 >>  8) & 0xFF
    buffer[2] = (int32 >> 16) & 0xFF
    buffer[3] = (int32 >> 24) & 0xFF
    return buffer
}

function list_contents(fname){
    var packentries = []

    bytecount = fs.statSync(fname)['size']

    var fd = fs.openSync(fname, 'r')
    var buffer = Buffer.alloc(bytecount)
    fs.readSync(fd, buffer, 0, bytecount, 0, function(err, num) {
        if(err) {
            console.log(err)
            return
        }
    })

    fs.closeSync(fd)

    if(buffer.slice(0, 4).toString('ascii') != 'PACK')
    {
        console.log('invalid pack file format')
        return 
    }

    dir_offset = bytearray_readInt32(buffer, 4)
    dir_length = bytearray_readInt32(buffer, 8)

    if(dir_offset + dir_length > bytecount) {
        console.log('invalid file format')
        return 
    }

    buf2 = buffer.slice(dir_offset, dir_offset + dir_length)
    
    var offset = 12 // "PACK" + dir_offset + dir_length
    
    for(var i = 0; i < dir_length/64; i++) {
        var entry = {}
        var hexarray = buf2.slice(i * 64, ((i+1) * 64) - 1)

        var entrycontext = hexarray.toString()
        entrycontext = entrycontext.substr(0, entrycontext.indexOf('\0'))

        var length = bytearray_readInt32(hexarray, 60)
        console.log(hexarray.slice(32, 63))
        console.log(hexarray)

        entry.imageName = entrycontext
        entry.imageLength = bytearray_readInt32(hexarray, 60)
        entry.imageData = buffer.slice(offset, offset + length)

        offset += length

        packentries.push(entry)
    }

    return (packentries)
}

function create_pack(files, output) {
    if(fs.existsSync(output)) {
        fs.unlinkSync(output)
    }
    var writestream = fs.createWriteStream(output)

    writestream.write('PACK')

    var offset = 4 + 4 + 4

    files.forEach(element => {
        offset += fs.statSync(element)['size']
    })


    writestream.write(bytearray_fromInt32(offset))
    writestream.write(bytearray_fromInt32(files.length * 64))

    files.forEach(element => {
        var fd = fs.openSync(element, 'r')
        bytecount = fs.statSync(element)['size']
        var buffer = Buffer.alloc(bytecount)
        fs.read(fd, buffer, 0, bytecount, 0, function(err, num) {
            if(err) {
                console.log(err)
                return
            }
        })

        writestream.write(buffer)
    })

    var offset = 4 + 4 + 4

    files.forEach(element => {
        if(element.length > 56) 
        {
            console.log('to long')
            return
        }

        var buffer = new Uint8Array(56)
        for(var i = 0; i < 56; i++)
            buffer[i] = '\0'

        var fname = path.parse(element).base

        for(var i = 0; i < fname.length; i++)
            buffer[i] = fname.charCodeAt(i)

        writestream.write(buffer)

        var fsize = fs.statSync(element)['size']

        writestream.write(bytearray_fromInt32(offset))
        writestream.write(bytearray_fromInt32(fsize))

        offset += fsize
    })
}

exports.list_contents = list_contents
exports.create = create_pack