exports.assertion = function elementCount(selector, count) {
    this.message = 'Testing if element <' + selector + '> has count: ' + count

    this.expected = count

    this.pass = function pass(val) {
        return val === this.expected
    }

    this.value = function value(res) {
        return res.value.length
    }

    this.command = function command(callback) {
        return this.api.elements(this.client.locateStrategy, selector, callback)
    }
}
