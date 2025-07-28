try {
    const BigInt = require('big-integer');

    // Convert value from given base to decimal
    function valueToDecimal(value, base) {
        return BigInt(value, parseInt(base));
    }

    // Modular inverse using Extended Euclidean Algorithm
    function modInverse(a, m) {
        let m0 = m;
        let x0 = BigInt(0);
        let x1 = BigInt(1);
        
        a = ((a.mod(m)).plus(m)).mod(m); // Ensure a is positive
        
        if (m.eq(1)) return BigInt(0);
        
        while (a.gt(1)) {
            let qr = a.divmod(m);
            let q = qr.quotient;
            let t = m;
            m = a.mod(m);
            a = t;
            t = x0;
            x0 = x1.minus(q.multiply(t));
            x1 = t;
        }
        
        if (x1.lt(0)) x1 = x1.plus(m0);
        
        return x1;
    }

    // Reconstruct secret using Lagrange interpolation
    function reconstructSecret(shares, k, prime) {
        let secret = BigInt(0);
        
        for (let i = 0; i < k; i++) {
            let xi = shares[i][0];
            let yi = shares[i][1];
            
            let numerator = BigInt(1);
            let denominator = BigInt(1);
            
            for (let j = 0; j < k; j++) {
                if (i !== j) {
                    let xj = shares[j][0];
                    numerator = numerator.multiply(xj.negate()).mod(prime);
                    denominator = denominator.multiply(xi.minus(xj)).mod(prime);
                }
            }
            
            let term = yi.multiply(numerator).multiply(modInverse(denominator, prime)).mod(prime);
            secret = secret.plus(term).mod(prime);
        }
        
        if (secret.lt(0)) secret = secret.plus(prime);
        return secret;
    }

    // Process test case
    function solveShamirSecret(testCase) {
        if (!testCase || !testCase.keys || !testCase.keys.n || !testCase.keys.k) {
            throw new Error("Invalid test case format");
        }

        const { keys, ...points } = testCase;
        const k = keys.k;
        
        // Convert shares to [x, y] pairs
        const shares = [];
        for (let x in points) {
            if (!points[x].base || !points[x].value) {
                throw new Error(`Invalid share format for x=${x}`);
            }
            const xValue = BigInt(x);
            const yValue = valueToDecimal(points[x].value, points[x].base);
            shares.push([xValue, yValue]);
        }
        
        if (shares.length < k) {
            throw new Error("Not enough shares to reconstruct the secret");
        }
        
        // Use first k shares
        const selectedShares = shares.slice(0, k);
        
        // Large prime for Test Case 2 (2^127 - 1)
        const prime = BigInt("170141183460469231731687303715884105727");
        
        // Reconstruct the secret
        const secret = reconstructSecret(selectedShares, k, prime);
        
        return secret.toString();
    }

    // Run both test cases
    try {
        const testCase1 = require('./file1');
        const testCase2 = require('./file2');
        console.log("Secret for Test Case 1:", solveShamirSecret(testCase1));
        console.log("Secret for Test Case 2:", solveShamirSecret(testCase2));
    } catch (err) {
        console.error("Error running test cases:", err.message);
    }

    module.exports = solveShamirSecret;

} catch (err) {
    console.error("Error loading big-integer module:", err.message);
    console.error("Please run 'npm install big-integer' in the hashira directory.");
}