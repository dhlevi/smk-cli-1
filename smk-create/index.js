const chalk = require( 'chalk' )
const fs = require( 'fs' )
const path = require( 'path' )
const inquirer = require( 'inquirer' )
const shell = require( 'shelljs' )
const semverRsort = require( 'semver/functions/rsort' )

module.exports = async function ( args ) {
    const name = args._.shift()
    const baseDir = args.base || args.b || process.cwd()
    const package = args.smkPackage
    const version = args.smkPackageVersion

    console.log( chalk.blue( 'Welcome to the SMK application creation tool!' ) )
    console.log( chalk.blue( 'A application skeleton will be created for you at the current directory.' ) )
    console.log( chalk.blue( 'But first, please answer some questions about your new SMK application.' ) )
    console.log()

    const app = await inquireAppInfo( name, baseDir, package, version );
    app.tool = app.tools.reduce( function ( acc, t ) { acc[ t ] = true; return acc }, {} )

    app.absoluteDir = path.resolve( baseDir, app.name )
    if ( fs.existsSync( app.absoluteDir ) ) {
        console.log( `Project directory ${ app.absoluteDir } already exists` )
        return
    }

    app.createdDate = ( new Date() ).toISOString()
    app.smkDistPath = `./node_modules/${ app.smkPackage }/dist/smk.js`

    console.log()
    console.log( chalk.green( `Creating application directory ${ app.absoluteDir.replace( process.cwd(), '.' ) } with template "${ app.template }"...` ) )
    require( './template-' + app.template )( app, app.absoluteDir )

    installApplication()

    console.log(chalk.green('Your application has been created.'));

    const editApp = await inquirer.prompt( [ {
        name: 'answer',
        type: 'input',
        message: 'Would you like to edit the application now? ',
        suffix: 'y/n',
        validate: function ( answer ) {
            if ( !/^[yn]/i.test( answer ) ) return false
            return true
        }
    } ] )
    if ( editApp.answer.toLowerCase() == 'y' ) {
        args.base = app.absoluteDir
        return require( '../smk-edit' )( args )
    }

    console.log()
    console.log( chalk.green( 'To view this application:' ) )
    console.log( chalk.blueBright( `  cd ${ app.name }` ) )
    console.log( chalk.blueBright( '  npm run view' ) )
    console.log()
    console.log( chalk.green( 'To modify the configuration for this application:' ) )
    console.log( chalk.blueBright( `  cd ${ app.name }` ) )
    console.log( chalk.blueBright( `  ${ args.exec } edit` ) )
    console.log()

    function installApplication() {
        console.log()
        console.log( chalk.green( 'Installing application dependencies...' ) )

        shell.cd( app.absoluteDir )

        const npmInstall = shell.exec( 'npm install' )
        if ( npmInstall.code != 0 ) {
            console.log( chalk.red( 'npm install failed' ) )
            throw Error( 'Application install failed' )
        }

        shell.exec( 'npm ls --depth=0' )
    }
}

async function inquireAppInfo( name, baseDir, package, version ) {
    return inquirer.prompt( [
        {
            name: 'name',
            type: 'input',
            message: "Enter your application's name:",
            default: name || 'SMK-App',
            validate: function( value )
            {
                if ( !value ) return 'A application name is required to create a new SMK application.'
                var dir = path.resolve( baseDir, value )
                if ( fs.existsSync( dir ) ) return `This application name can't be used as the directory ${ dir.replace( process.cwd(), '.' ) } already exists.`

                return true
            }
        },
        {
            name: 'title',
            type: 'input',
            message: "Enter your application's title:",
            default: 'My SMK Application'
        },
        {
            name: 'description',
            type: 'input',
            message: "Enter a short description for your application:",
            default: 'My Simple Map Kit application.'
        },
        {
            name: 'author',
            type: 'input',
            message: "Enter the author's name:",
            default: 'SMK Developer'
        },
        {
            name: 'smkPackage',
            type: 'input',
            message: `Enter the package name of SMK:`,
            default: package,
            validate: function ( value ) {
                const view = JSON.parse( shell.exec( `npm view ${ value } --json`, { silent: true } ) )
                if ( view.error )
                    return view.error.summary.split( '\n' )[ 0 ]

                return true
            }
        },
        {
            name: 'smkVersion',
            type: 'list',
            default: version,
            message: function ( app ) {
                return `Select the version of ${ chalk.yellow( app.smkPackage ) } for your application:`
            },
            choices: function ( app ) {
                return semverRsort( JSON.parse( shell.exec( `npm view ${ app.smkPackage } versions --json`, { silent: true } ).stdout ) )
            }
        },
        {
            name: 'template',
            type: 'list',
            message: 'Select the template for your application:',
            choices: [ 'default', 'mobile' ],
            default: 'default'
        },
        {
            name: 'viewer',
            type: 'list',
            message: 'Select the type of map viewer:',
            choices: [ 'leaflet', 'esri3d' ],
            default: 'leaflet'
        },
        // {
        //     name: 'longitude',
        //     type: 'input',
        //     message: 'Starting Longitude:',
        //     default: '-128.7817'
        // },
        // {
        //     name: 'latitude',
        //     type: 'input',
        //     message: 'Starting Latitude:',
        //     default: '53.7764'
        // },
        // {
        //     name: 'zoom',
        //     type: 'input',
        //     message: 'Starting zoom:',
        //     default: '5',
        //     validate: function( value )
        //     {
        //         if (parseInt(value) >= 0 && parseInt(value) <= 20 ) return true;
        //         else return 'Zoom level must be a value from 0 to 20';
        //     }
        // },
        // {
        //     name: 'basemaps',
        //     type: 'checkbox',
        //     message: 'Select your basemap options:',
        //     choices: ['Streets', 'Topographic', 'NationalGeographic', 'Oceans', 'Gray', 'DarkGray', 'Imagery', 'ShadedRelief'],
        //     default: ['Topographic', 'Imagery', 'Gray']
        // },
        {
            name: 'baseMap',
            type: 'list',
            message: 'Select the base map:',
            choices: [ 'Streets', 'Topographic', 'NationalGeographic', 'Oceans', 'Gray', 'DarkGray', 'Imagery', 'ShadedRelief' ],
            default: 'Topographic'
        },
        {
            name: 'tools',
            type: 'checkbox',
            message: 'Select the tools:',
            choices: [ 'about', 'coordinate', 'layers', 'pan', 'zoom', 'measure', 'markup', 'scale', 'minimap', 'directions', 'location', 'select', 'identify', 'search' ],
            default: [ 'about', 'coordinate', 'layers', 'pan', 'zoom', 'scale', 'minimap', 'identify', 'search' ]
        }
    ] )
}
