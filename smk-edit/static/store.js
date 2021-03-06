import config from './store/config.js'

export const store = new Vuex.Store( {
    modules: {
        config: config
    },
    state: {
        packageVersion: null,
        configFile: null,
        serviceStatus: true,
        statusPingInterval: 5000,
        dirtyConfig: false,
        activeTab: null,
        wmsCatalogUrl: 'https://openmaps.gov.bc.ca/geo/pub/wms',
        wmsCatalogUrls: [
            'https://openmaps.gov.bc.ca/geo/pub/wms',
            'https://maps.th.gov.bc.ca/geoV05/ows',
            'https://geo.nrs.gov.bc.ca/pub/geoserver/wms'
        ],
        version: 1,
        smkUrl: '/module/smk.js'
    },
    mutations: {
        // /^(?!serviceStatus)/ -- filter out these mutations from devtools
        serviceStatus: function ( state, status ) {
            state.serviceStatus = status
        },
        activeTab: function ( state, tab ) {
            state.activeTab = tab
        },
        dirtyConfig: function ( state, dirty ) {
            state.dirtyConfig = dirty
        },
        wmsCatalogUrl: function ( state, url ) {
            state.wmsCatalogUrl = url
        },
        addWmsCatalogUrl: function ( state, url ) {
            if ( state.wmsCatalogUrls.includes( url ) ) return
            state.wmsCatalogUrls.push( url )
        },
        bumpVersion: function ( state ) {
            state.version += 1
        }
    },
    getters: {
        version: function ( state ) { return state.version },

        wmsCatalogUrls: function ( state, getters ) {
            return getters.configLayersWms.reduce( function ( acc, ly ) {
                if ( acc.includes( ly.serviceUrl ) ) return acc
                return acc.concat( ly.serviceUrl )
            }, state.wmsCatalogUrls )
        }
    },
    actions: {
        loadConfig: function ( context ) {
            return fetch( '/config' )
                .then( function ( resp ) {
                    if ( !resp.ok ) throw Error( 'failed to get config' )
                    return resp.json()
                } )
                .then( function ( data ) {
                    context.commit( 'config', data )
                } )
                .catch( function ( err ) {
                    M.toast( {
                        html: 'Error: ' + JSON.stringify( err )
                    } )
                } )
        },
        saveConfig: function ( context ) {
            return fetch( '/config', {
                    method: 'POST',
                    cache: 'no-cache',
                    headers: {
                        'content-type': 'application/json',
                    },
                    body: JSON.stringify( context.state.config )
                } )
                .then( function( resp ) {
                    return resp.json()
                } )
                .then( function ( result ) {
                    if ( !result.ok ) throw Error( 'Result failed' )
                    M.toast( {
                        html: JSON.stringify( result.message )
                    } )
                    context.commit( 'dirtyConfig', false )
                } )
                .catch( function ( err ) {
                    M.toast( {
                        html: 'Error: ' + JSON.stringify( err )
                    } )
                } )
        },
        statusCheck: function ( context ) {
            var nextPing
            return fetch( '/ping' )
                .then( function ( resp ) {
                    if ( !resp.ok ) throw Error( 'ping failed' )
                    return resp.json()
                } )
                .then( function ( obj ) {
                    if ( !obj.ok ) throw Error( 'ping failed' )

                    if ( obj.next )
                        context.state.statusPingInterval = obj.next

                    if ( obj.version )
                        context.state.packageVersion = obj.version

                    if ( obj.config )
                        context.state.configFile = obj.config

                    context.commit( 'serviceStatus', true )
                } )
                .catch( function () {
                    context.commit( 'serviceStatus', false )
                } )
        }
    }
} )

store.subscribe( function ( mutation ) {
    // console.log(mutation)
    if ( mutation.type.startsWith( 'config' ) && mutation.type.length > 6 ) {
        store.commit( 'dirtyConfig', true )
    }
} )
