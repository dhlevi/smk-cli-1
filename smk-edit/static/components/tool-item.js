import { vueComponent } from '../vue-util.js'
import { toolTypePresentation } from './presentation.js'

vueComponent( import.meta.url, {
    props: {
        toolType: String,
        toolInstance: String,
        allowed: Object,
        summary: Boolean
    },
    computed: {
        typeTitle: function () { return toolTypePresentation[ this.toolType ].title },
        typeIcon: function () {
            return this.$store.getters.configHasTool( this.toolType, this.toolInstance ) &&
                this.$store.getters.configTool( this.toolType, this.toolInstance ).icon ||
                toolTypePresentation[ this.toolType ] && toolTypePresentation[ this.toolType ].default.icon ||
                'build'
        },
        allowedEdit: function () { return toolTypePresentation[ this.toolType ].details !== false && this.allowed && this.allowed.edit !== false },
        allowedRemove: function () { return this.allowed && this.allowed.remove !== false },
        allowedEnable: function () { return this.allowed && this.allowed.enable !== false },
        allowedDisable: function () { return this.allowed && this.allowed.disable !== false },
        toolSummary: function () {
            var comp = 'tool-summary-' + this.toolType
            if ( Vue.component( comp ) ) return comp
            return 'tool-summary'
        }
    },
    methods: {
        edit: function () { this.$emit( 'edit-tool', this.toolType, this.toolInstance ) },
        remove: function () { this.$emit( 'remove-tool', this.toolType, this.toolInstance ) },
        enable: function () { this.$emit( 'enable-tool', this.toolType, this.toolInstance ) },
        disable: function () { this.$emit( 'disable-tool', this.toolType, this.toolInstance ) },
    },
} )

var summaryMixin = {
    props: [ 'toolType', 'toolInstance' ]
}

Vue.component( 'tool-summary', {
    mixins: [ summaryMixin ],
    template: `
        <div>
            <h6 class="title" v-if="title">"{{ title }}"</h6>
            <pre v-if="!title && config">{{ config }}</pre>
        </div>
    `,
    computed: {
        title: function () {
            // if ( this.$store.getters.configHasTool( this.toolType, this.toolInstance ) )
            return this.$store.getters.configTool( this.toolType, this.toolInstance ).title
        },
        config: function () {
            var cfg = JSON.parse( JSON.stringify( this.$store.getters.configTool( this.toolType, this.toolInstance ) ) )
            delete cfg.type
            delete cfg.instance
            delete cfg.title
            delete cfg.enabled
            return JSON.stringify( cfg, null, '  ' ).slice( 2, -2 ).trim()
        }
    }
} )

Vue.component( 'tool-summary-query', {
    mixins: [ summaryMixin ],
    template: `
        <h6 class="title" v-if="title">"{{ title }}"</h6>
    `,
    computed: {
        layerId: function () { return this.toolInstance.split( '--' )[ 0 ] },
        queryId: function () { return this.toolInstance.split( '--' )[ 1 ] },
        title: function () {
            return this.$store.getters.configLayerQuery( this.layerId, this.queryId ).title
        },
    }
} )