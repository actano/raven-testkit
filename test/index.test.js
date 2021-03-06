
const {expect} = require('chai')
const Raven = require('raven-js')
const testKitInitializer = require('../dist/index.js')

const DUMMY_DSN = 'https://acacaeaccacacacabcaacdacdacadaca@sentry.io/000001'

describe('raven test-kit test suite', function() {
    
    before(function() {
        Raven.config(DUMMY_DSN, {release: 'test'})
    })

    it('should be properly initialized with empty reports', function() {
        const testKit = testKitInitializer(Raven)
        expect(testKit).to.exist
        expect(testKit.reports()).to.be.empty
    })

    it('should report to test kit instead of sending http request', function() {
        const testKit = testKitInitializer(Raven)
        Raven.captureException(new Error('raven test kit is awesome!'), {extra: {os: 'mac-os'}})
        expect(testKit.reports()).to.have.lengthOf(1)
        const report = testKit.reports()[0]
        expect(report).to.have.property('release').to.equal('test')
        expect(report).to.have.property('extra').to.have.property('os').to.equal('mac-os')
        expect(report).to.have.property('exception').to.satisfy(exception => {
            const errorDetails = exception.values[0]
            return errorDetails.type === 'Error' && errorDetails.value === 'raven test kit is awesome!'
        })
    })

    it('should extract the exception out of the report', function() {
        const testKit = testKitInitializer(Raven)
        Raven.captureException(new Error('testing exception extraction'))
        const report = testKit.reports()[0]
        const {type, value} = testKit.extractException(report)
        expect(type).to.equals('Error')
        expect(value).to.equals('testing exception extraction')
    })

    it('should extract the exception out of the report at specific index', function() {
        const testKit = testKitInitializer(Raven)
        Raven.captureException(new Error('testing get exception at index 0'))
        Raven.captureException(new Error('testing get exception at index 1'))
        const {value} = testKit.getExceptionAt(1)
        expect(value).to.equals('testing get exception at index 1')
    })

    it('should find the report with a specific error', function() {
        const testKit = testKitInitializer(Raven)
        const err = new Error('error to look for')
        Raven.captureException(err)
        const report = testKit.findReport(err)
        expect(report).to.exist
    })

    it('should not find the report with a specific error', function() {
        const testKit = testKitInitializer(Raven)
        Raven.captureException(new Error('simple error'))
        const report = testKit.findReport(new Error('error to look for'))
        expect(report).to.be.undefined
    })

    it('should reset and empty the reports log', function() {
        const testKit = testKitInitializer(Raven)
        Raven.captureException(new Error('raven test kit is awesome!'))
        expect(testKit.reports()).to.have.lengthOf(1)
        testKit.reset()
        expect(testKit.reports()).to.be.empty
    })

    it('should not report if \'shouldSendCallback\' returns false ', function() {
        const shouldSendCallback = data => false
        const testKit = testKitInitializer(Raven, shouldSendCallback)
        Raven.captureException(new Error('raven test kit is awesome!'))
        expect(testKit.reports()).to.have.lengthOf(0)        
    })

    it('should report if \'shouldSendCallback\' returns true', function() {
        const shouldSendCallback = data => true
        const testKit = testKitInitializer(Raven, shouldSendCallback)
        Raven.captureException(new Error('raven test kit is awesome!'))
        expect(testKit.reports()).to.have.lengthOf(1)
    })
})