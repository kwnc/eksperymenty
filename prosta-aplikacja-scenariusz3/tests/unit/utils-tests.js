describe('Utils Unit Tests', () => {

    it('should debounce function calls correctly', (done) => {
        let callCount = 0;
        const debouncedFn = Utils.debounce(() => {
            callCount++;
        }, 100);

        // Call multiple times rapidly
        debouncedFn();
        debouncedFn();
        debouncedFn();

        expect(callCount).toBe(0); // Should not have been called yet

        setTimeout(() => {
            expect(callCount).toBe(1); // Should have been called once after delay
            done();
        }, 150);
    });

    it('should throttle function calls correctly', (done) => {
        let callCount = 0;
        const throttledFn = Utils.throttle(() => {
            callCount++;
        }, 100);

        // Call multiple times rapidly
        throttledFn(); // Should execute immediately
        throttledFn(); // Should be throttled
        throttledFn(); // Should be throttled

        expect(callCount).toBe(1);

        setTimeout(() => {
            throttledFn(); // Should execute after throttle period
            expect(callCount).toBe(2);
            done();
        }, 150);
    });

    it('should sanitize HTML correctly', () => {
        const maliciousScript = '<script>alert("xss")</script>';
        const sanitized = Utils.sanitizeHtml(maliciousScript);
        expect(sanitized).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');

        const simpleText = 'Hello World';
        expect(Utils.sanitizeHtml(simpleText)).toBe('Hello World');
    });

    it('should format file sizes correctly', () => {
        expect(Utils.formatFileSize(0)).toBe('0 B');
        expect(Utils.formatFileSize(1024)).toBe('1 KB');
        expect(Utils.formatFileSize(1048576)).toBe('1 MB');
        expect(Utils.formatFileSize(1073741824)).toBe('1 GB');
        expect(Utils.formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should generate unique IDs', () => {
        const id1 = Utils.generateId();
        const id2 = Utils.generateId();
        const id3 = Utils.generateId('test');

        expect(id1).not.toBe(id2);
        expect(id3).toContain('test_');
        expect(id1).toContain('id_');
    });

    it('should escape and unescape HTML correctly', () => {
        const html = '<div class="test">Hello & "World"</div>';
        const escaped = Utils.escapeHtml(html);
        expect(escaped).toBe('&lt;div class=&quot;test&quot;&gt;Hello &amp; &quot;World&quot;&lt;/div&gt;');

        const unescaped = Utils.unescapeHtml(escaped);
        expect(unescaped).toBe(html);
    });

    it('should format dates correctly', () => {
        const date = new Date('2023-12-25T10:30:00');

        const formattedDate = Utils.formatDate(date);
        expect(formattedDate).toContain('Dec');
        expect(formattedDate).toContain('25');
        expect(formattedDate).toContain('2023');

        const formattedTime = Utils.formatTime(date);
        expect(formattedTime).toContain('10:30');

        const formattedDateTime = Utils.formatDateTime(date);
        expect(formattedDateTime).toContain('Dec');
        expect(formattedDateTime).toContain('10:30');
    });

    it('should detect today and yesterday correctly', () => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(today.getDate() - 2);

        expect(Utils.isToday(today)).toBe(true);
        expect(Utils.isToday(yesterday)).toBe(false);
        expect(Utils.isYesterday(yesterday)).toBe(true);
        expect(Utils.isYesterday(twoDaysAgo)).toBe(false);
    });

    it('should calculate relative time correctly', () => {
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60000);
        const oneHourAgo = new Date(now.getTime() - 3600000);
        const oneDayAgo = new Date(now.getTime() - 86400000);

        expect(Utils.getRelativeTime(oneMinuteAgo)).toContain('minute');
        expect(Utils.getRelativeTime(oneHourAgo)).toContain('hour');
        expect(Utils.getRelativeTime(oneDayAgo)).toBe('Yesterday');
    });

    it('should truncate text correctly', () => {
        const longText = 'This is a very long text that should be truncated';
        const truncated = Utils.truncateText(longText, 20);

        expect(truncated).toHaveLength(23); // 20 + '...'
        expect(truncated).toContain('...');
        expect(truncated).toBe('This is a very long ...');

        const shortText = 'Short';
        expect(Utils.truncateText(shortText, 20)).toBe('Short');
    });

    it('should capitalize first letter correctly', () => {
        expect(Utils.capitalizeFirst('hello')).toBe('Hello');
        expect(Utils.capitalizeFirst('HELLO')).toBe('HELLO');
        expect(Utils.capitalizeFirst('')).toBe('');
        expect(Utils.capitalizeFirst(null)).toBe(null);
    });

    it('should convert to camelCase correctly', () => {
        expect(Utils.toCamelCase('hello-world')).toBe('helloWorld');
        expect(Utils.toCamelCase('hello_world')).toBe('helloWorld');
        expect(Utils.toCamelCase('hello world')).toBe('helloWorld');
        expect(Utils.toCamelCase('HELLO-WORLD')).toBe('hELLOWORLD');
    });

    it('should convert to kebab-case correctly', () => {
        expect(Utils.toKebabCase('helloWorld')).toBe('hello-world');
        expect(Utils.toKebabCase('HelloWorld')).toBe('hello-world');
        expect(Utils.toKebabCase('XMLHttpRequest')).toBe('x-m-l-http-request');
    });

    it('should validate JSON correctly', () => {
        expect(Utils.isValidJSON('{"valid": true}')).toBe(true);
        expect(Utils.isValidJSON('[]')).toBe(true);
        expect(Utils.isValidJSON('"string"')).toBe(true);
        expect(Utils.isValidJSON('invalid json')).toBe(false);
        expect(Utils.isValidJSON('{invalid: json}')).toBe(false);
    });

    it('should validate emails correctly', () => {
        expect(Utils.validateEmail('test@example.com')).toBe(true);
        expect(Utils.validateEmail('user.name+tag@domain.co.uk')).toBe(true);
        expect(Utils.validateEmail('invalid.email')).toBe(false);
        expect(Utils.validateEmail('@domain.com')).toBe(false);
        expect(Utils.validateEmail('test@')).toBe(false);
    });

    it('should validate URLs correctly', () => {
        expect(Utils.validateUrl('https://example.com')).toBe(true);
        expect(Utils.validateUrl('http://localhost:3000')).toBe(true);
        expect(Utils.validateUrl('ftp://files.example.com')).toBe(true);
        expect(Utils.validateUrl('not-a-url')).toBe(false);
        expect(Utils.validateUrl('http://')).toBe(false);
    });

    it('should deep clone objects correctly', () => {
        const original = {
            name: 'Test',
            nested: {
                value: 42,
                array: [1, 2, { deep: true }]
            },
            date: new Date('2023-01-01')
        };

        const cloned = Utils.deepClone(original);

        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned.nested).not.toBe(original.nested);
        expect(cloned.nested.array).not.toBe(original.nested.array);
        expect(cloned.date).toBeInstanceOf(Date);
        expect(cloned.date.getTime()).toBe(original.date.getTime());
    });

    it('should handle localStorage operations correctly', () => {
        const originalLocalStorage = window.localStorage;
        window.localStorage = createMockStorage();

        // Test set and get
        const success = Utils.localStorage.set('testKey', { data: 'test' });
        expect(success).toBe(true);

        const retrieved = Utils.localStorage.get('testKey');
        expect(retrieved).toEqual({ data: 'test' });

        // Test default value
        const defaultValue = Utils.localStorage.get('nonExistent', 'default');
        expect(defaultValue).toBe('default');

        // Test remove
        const removed = Utils.localStorage.remove('testKey');
        expect(removed).toBe(true);
        expect(Utils.localStorage.get('testKey')).toBeNull();

        // Test clear
        Utils.localStorage.set('key1', 'value1');
        Utils.localStorage.set('key2', 'value2');
        const cleared = Utils.localStorage.clear();
        expect(cleared).toBe(true);
        expect(Utils.localStorage.get('key1')).toBeNull();
        expect(Utils.localStorage.get('key2')).toBeNull();

        window.localStorage = originalLocalStorage;
    });
});