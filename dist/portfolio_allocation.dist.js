/**
 * @file Header
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

/* Start Not to be used as is in Google Sheets */
var PortfolioAllocation = PortfolioAllocation || {};

PortfolioAllocation = (function(self) {

/* End Not to be used as is in Google Sheets */
/**
* @author Roman Rubsamen <roman.rubsamen@gmail.com>
*/

 



/**
* @function randomCorrelationMatrix
*
* @summary Returns a random correlation matrix.
*
* @description This function computes a random n by n correlation matrix, 
* using the algorithm described in the reference
* 
* @see <a href="https://link.springer.com/article/10.1023/A:1022384216930">Philip I. Davies and Nicholas J. Higham, Numerically Stable Generation of Correlation Matrices and Their Factors,BIT Numerical Mathematics volume 40, pages 640–651 (2000)</a>
*
* @param {number} n the row/column length of the matrix to construct, natural integer greater than or equal to 1.
* @param {object} opt optional parameters for the random correlation matrix generation algorithm.
* @param {number} opt.eps tolerance for the convergence of the algorithm, a strictly positive real number; defaults to 1e-14.
* @param {Array.<number>} opt.lambda the desired eigenvalues lambda_i, i=1..n of the generated correlation matrix, an array of n real numbers lambda_i,
* which must satisfy 0 <= lambda_i, i = 1..n and sum_i lambda_i = n; defaults to an array of random numbers belonging to [0,1] and summing to one.
* @param {number} opt.epsLambda tolerance for the condition that the provided eigenvalues must sum to one; defaults to 1e-8.
*
* @return {Matrix_} the computed matrix.
*
*/
self.randomCorrelationMatrix = function(n, opt) {
	// Generate the random correlation matrix
	return Matrix_.randomCorrelation(n, opt);
}


/**
* @author Roman Rubsamen <roman.rubsamen@gmail.com>
*/

 


/**
* @function covarianceMatrix
*
* @summary Returns the covariance matrix of series of values.
*
* @description This function computes the covariance matrix of series of values.
*
* @see <a href="https://en.wikipedia.org/wiki/Covariance_matrix">Covariance matrix</a>
* @see <a href="https://en.wikipedia.org/wiki/Sample_mean_and_covariance">Sample mean and covariance</a>
* @see <a href="https://link.springer.com/article/10.1023/A:1022384216930">O. Ledoit, M. Wolf, A Well-Conditioned Estimator for Large-Dimensional Covariance Matrices, Journal of Multivariate Analysis, Volume 88, Issue 2, February 2004, pages 365-411.</a>
* @see <a href="https://jpm.pm-research.com/content/30/4/110">O. Ledoit, M. Wolf, Honey, I Shrunk the Sample Covariance Matrix, The Journal of Portfolio Management Summer 2004, 30 (4) 110-119</a>
* @see <a href="https://pubmed.ncbi.nlm.nih.gov/16646851/">J. Schafer, K. Strimmer, A Shrinkage Approach to Large-Scale Covariance Matrix Estimation and Implications for Functional Genomics, Statistical Applications in Genetics and Molecular Biology, Volume 4, Issue 1, 2005</a>
* @see <a href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3400062">G. De Nard, Oops! I Shrunk the Sample Covariance Matrix Again: Blockbuster Meets Shrinkage, Journal of Financial Econometrics, 2020</a>
*
* @param {Array.<Array.<number>>} arr an array of n arrays of m real numbers, with n and m natural integers
* greater than or equal to 1, with n representing the number of series (or features) and m representing the number of observations per series.
* @param {object} opt optional parameters for the covariance matrix computation.
* @param {string} opt.method the method to use to compute the covariance matrix, a string either equals to:
* - "covariance", in order to compute the covariance matrix, c.f. the first reference
* - "sample-covariance", in order to compute the sample covariance matrix, c.f. the second reference
* - "ledoit-wolf-shrinked-covariance", in order to compute the asymptotically optimal convex linear combination of the covariance matrix with a shrinkage target matrix, c.f. 
* the fourth reference
; defaults to "covariance"
* @param {string} opt.shrinkageTarget in case opt.method is equal to "ledoit-wolf-shrinked-covariance", the shrinkage target matrix to use, a string either equals to:
* - "constant-variance-null-correlation", in order to use a multiple of the identity matrix, c.f. the third reference
* - "constant-variance-correlation", in order to use a multiple of the identity matrix plus a multiple of the matrix with 1s everywhere except on the diagonal with 0s, c.f. the sixth reference
* - "null-correlation", in order to use a covariance matrix made of different variances and a null correlation coefficient, c.f. the fifth reference (target D), which is computed using 
* the generic formula in appendix B of fourth reference applied to the used target shrinkage matrix
* - "constant-correlation", in order to use a covariance matrix made of different variances and a constant correlation coefficient, c.f. the fourth reference
*
* @return {Matrix_} a Matrix object representing the covariance matrix of the input series of values.
*
* @example
* covarianceMatrix([[0.05, 0.01, 0.01], [-0.05, 0.03, -0.01]]);
* // == Matrix_([[0.00036,  -0.00053], [-0.00053, 0.00107]])
*
* covarianceMatrix([[0.05, 0.01, 0.01], [-0.05, 0.03, -0.01]], {method: "sample-covariance"});
* // == Matrix_([[0.00053, -0.0008], [-0.0008, 0.0016]])
*/
self.covarianceMatrix = function(arr, opt) {
	// Initialize default parameters
	var opt = opt;
	if (opt === undefined) {
		opt = { };
	}
	if (opt.method === undefined) {
		opt.method = "covariance";
	}
	
	
	// Decode the parameters
	var covarianceMethod = opt.method;
	if (covarianceMethod != "covariance" &&
	    covarianceMethod != "sample-covariance" &&
		covarianceMethod != "ledoit-wolf-shrinked-covariance") {
			throw new Error('unsupported covariance matrix computation method');
	}

	var shrinkageTarget = opt.shrinkageTarget;
	if ( covarianceMethod == "ledoit-wolf-shrinked-covariance" &&
	    ["constant-variance-null-correlation", 
		 "constant-variance-correlation", 
		 "null-correlation", 
		 "constant-correlation"].indexOf(shrinkageTarget) == -1 ) {
		 throw new Error('unsupported covariance matrix shrinkage target');
	}
	
	
	//
	var nbSeries = arr.length;
	var nbObservations = arr[0].length;
	
	
	//
	var obj;
	
	// In case the covariance matrix computation method is either "covariance" or "sample-covariance",
	// proceed with a similar computation formula.
	if (covarianceMethod == "covariance" || covarianceMethod == "sample-covariance") {
		// Define the covariance function to use
		var covarianceFunction = covariance_;
		if (covarianceMethod == "sample-covariance") {
			covarianceFunction = sampleCovariance_;
		}

		// Construct the covariance matrix
		obj = allocateMatrix_(nbSeries, nbSeries);
		for (var i = 0; i < obj.nbRows; ++i) {
			// Copy from upper triangular part
			for (var j = 0; j < i; ++j) {
				obj.data[i * obj.nbColumns + j] = obj.data[j * obj.nbColumns + i];
			}
			
			// Computation part
			for (var j = i; j < obj.nbColumns; ++j) {
				obj.data[i * obj.nbColumns + j] = covarianceFunction(arr[i], arr[j]);
			}
		}
	}
	else if (covarianceMethod == "ledoit-wolf-shrinked-covariance") {
		// All "Ledoitt-Wolf" like linear shrinkage estimators share
		// a similar structure.
		
		// De-mean the series
		var means = Matrix_.fill(nbSeries, 1, function(i,j) { return mean_(arr[i-1]) });
		var x = Matrix_.fill(nbSeries, nbObservations, function(i,j) { return arr[i-1][j-1] - means.data[i-1] });
		
		// Compute the sample covariance matrix as defined in the third reference
		//
		// Note: contrary to the usual sample covariance matrix definition, there is no division per n-1 !
		var covMat = Matrix_.axty(1/nbObservations, x, x).toCovarianceMatrix();
		
		// Extract the standard deviations and the correlation matrix
		var stdvarVec = covMat.getStandardDeviations();	
		var corrMat = covMat.getCorrelationMatrix();
		
		// Compute the prior, c.f. appendix A of the fourth reference
		// for the general formula.
		var prior;
		var rBar;
		if (shrinkageTarget == "constant-variance-null-correlation") {
			// C.f. also lemma 3.2 of the third reference.
			var mu = covMat.trace() / nbSeries;
			prior = Matrix_.fill(nbSeries, nbSeries, function(i,j) { if (i == j) { return mu; } else { return 0; }  });
		}
		else if (shrinkageTarget == "constant-variance-correlation") {
			// C.f. also formulas 2.15a and 2.15b of the sixth reference
			var phi = covMat.trace() / nbSeries;
			var nu = 0;
			for (var i = 0; i < nbSeries - 1; ++i) {
				for (var j = i+1; j < nbSeries; ++j) {
					nu += covMat.data[i * covMat.nbColumns + j];
				}
			}
			nu *= 2/(nbSeries*(nbSeries-1)); 
			prior = Matrix_.fill(nbSeries, nbSeries, function(i,j) { if (i == j) { return phi; } else { return nu; }  });
		}	
		else if (shrinkageTarget == "null-correlation") {
			// C.f. also "Target D" in table 2 of the fifth reference
			prior = Matrix_.fill(nbSeries, nbSeries, 
								 function(i,j) { 
									 if (i == j) { 
										 return stdvarVec.data[i-1]*stdvarVec.data[i-1]; 
									 } 
									 else { 
										 return 0;
									 } 
								 });
		}
		else if (shrinkageTarget == "constant-correlation") {
			rBar = 0;
			for (var i = 0; i < nbSeries - 1; ++i) {
				for (var j = i+1; j < nbSeries; ++j) {
					rBar += corrMat.data[i * corrMat.nbColumns + j];
				}
			}
			rBar *= 2/(nbSeries*(nbSeries-1)); 
			prior = Matrix_.fill(nbSeries, nbSeries, 
								 function(i,j) { 
									 if (i == j) { 
										 return stdvarVec.data[i-1]*stdvarVec.data[i-1]; 
									 } 
									 else { 
										return rBar*stdvarVec.data[i-1]*stdvarVec.data[j-1] ;
									} 
								 });
		}

		// Compute pi hat, c.f. appendix B of the fourth reference
		// for the general formula.
		//
		// To be noted that in the case of constant variance/null covariance,
		// pi hat corresponds (up to a constant) to (b_n)^2,
		// c.f. lemma 3.4 of the third reference.
		var piMat = Matrix_.fill(nbSeries, nbSeries, 
								 function(i,j) { 
									//
									var pi_ij = 0;
									for (var k = 0; k < nbObservations; ++k) {
										 pi_ij += Math.pow((arr[i-1][k] - means.data[i-1])*(arr[j-1][k] - means.data[j-1]) - covMat.data[(i-1) * covMat.nbColumns + (j-1)], 2);
									}
									pi_ij /= nbObservations;
								
									//
									return pi_ij;
								 });
		var pi = piMat.sum();

		// Compute rho hat, c.f. appendix B of the fourth reference
		// for the general formula.
		var rho;
		if (shrinkageTarget == "constant-variance-null-correlation") {
			// Not needed from the third reference, c.f. also code cov1para.m from the authors
			// of the third reference.
			rho = 0;
		}
		else if (shrinkageTarget == "constant-variance-correlation") {
			// C.f. remark 2.4 of the sixth reference, this coefficient can
			// be neglected for all practical purposes.
			//
			// C.f. appendix A.1 of the sixth reference for the computation
			// formula, if ever needed.
			rho = 0;
		}	
		else if (shrinkageTarget == "null-correlation") {
			// In the specific case of null correlation, all the terms
			// AsyCov are null, so that only the terms AsyVar remain.
			rho = piMat.trace();
		}
		else if (shrinkageTarget == "constant-correlation") {
			rho = 0;
			for (var i = 1; i <= nbSeries; ++i) {
				for (var j = 1; j <= nbSeries; ++j) {
					// The sum defining rho skips i == j
					if (i == j) {
						continue;
					}
					
					// Compute theta_ii__ij and theta_jj__ij
					var theta_ii__ij = 0;
					for (var k = 0; k < nbObservations; ++k) {				
						 theta_ii__ij += ( Math.pow(arr[i-1][k] - means.data[i-1], 2) - covMat.data[(i-1) * covMat.nbColumns + (i-1)] )
										  *
										  ( (arr[i-1][k] - means.data[i-1])*(arr[j-1][k] - means.data[j-1]) - covMat.data[(i-1) * covMat.nbColumns + (j-1)] );
					}
					theta_ii__ij /= nbObservations;
					
					var theta_jj__ij = 0;
					for (var k = 0; k < nbObservations; ++k) {
						 theta_jj__ij += ( Math.pow(arr[j-1][k] - means.data[j-1], 2) - covMat.data[(j-1) * covMat.nbColumns + (j-1)] )
										  *
										  ( (arr[i-1][k] - means.data[i-1])*(arr[j-1][k] - means.data[j-1]) - covMat.data[(i-1) * covMat.nbColumns + (j-1)] );
					}
					theta_jj__ij /= nbObservations;
			
					// Update the running sum for rho
					rho += (stdvarVec.data[j-1]/stdvarVec.data[i-1]) * theta_ii__ij  
						   +
						   (stdvarVec.data[i-1]/stdvarVec.data[j-1]) * theta_jj__ij;
				}
			}
			rho *= rBar/2;
			rho += piMat.trace();
		}
		
		// Compute gamma hat, described appendix B of the fourth reference.
		//
		// To be noted that in the case of constant variance/null covariance,
		// gamma hat corresponds (up to a constant) to (d_n)^2,
		// c.f. lemma 3.3 of the third reference. 
		var gamma = Math.pow(Matrix_.xmy(covMat, prior).matrixNorm('frobenius'), 2);

		// Compute the optimal shrinkage factor, c.f.  appendix B of the fourth reference.
		var kappa = (pi - rho)/gamma;
		var shrinkage = Math.max(0, Math.min(1, kappa/nbObservations));
		
		// Compute the optimally shrinked covariance matrix,
		// c.f. formula 2 of the fourth reference.
		obj = Matrix_.axpby(shrinkage, prior, 1-shrinkage, covMat);
	}
	else {
		throw new Error('internal error: unsupported covariance matrix computation method');
	}

	// Add covariance matrix methods
	addCovarianceMatrixMethods_(obj);
	
	// Return it
	return obj;
}




/**
* @function addCovarianceMatrixMethods_
*
* @summary Add methods related to a covariance matrix to a Matrix object.
*
* @description This function adds methods related to a covariance matrix to a Matrix object.
*
* @param {Matrix_} a, a matrix.
* @return {void}
*
* @example
* addCovarianceMatrixMethods_(Matrix_([[1,0.1], [0.1,1]]));
* // 
*/
function addCovarianceMatrixMethods_(matrix) {
	var methods = {
    	/**
    	* @function getCorrelationMatrix
    	*
    	* @summary Returns the correlation matrix associated to a covariance matrix.
    	*
    	* @description This function computes a correlation matrix (c_ij),i=1..n,j=1..n from the original 
    	* matrix (a_ij),i=1..n,j=1..n, with coefficients satisfying c_ij = a_ij/(a_ii * a_jj).
    	*
    	* @memberof Matrix_
		* @param {Matrix_} out an optional n by n matrix.
    	* @return {Matrix_} a n by n matrix containing the correlation matrix associated to the covariance matrix,
		* either stored in the matrix out or in a new matrix.
    	*
    	* @example
    	* Matrix_([[1, 1, 8.1], [1, 16, 18], [8.1, 18, 81]]).getCorrelationMatrix();
    	* // Matrix_([[1, 0.25, 0.9], [0.25, 1, 0.5], [0.9, 0.5, 1]])
    	*/
		'getCorrelationMatrix': function(out) { 
			// Result matrix allocation
			var obj = allocateMatrix_(this.nbRows, this.nbColumns, out);
			
			// Computation of the correlation matrix
			for (var i = 0; i < obj.nbRows; ++i) {
				// Standard deviation of a_ii
				var stdDevI = Math.sqrt(this.data[i * this.nbColumns + i]);
				
				// Copy from upper triangular part
				for (var j = 0; j < i; ++j) {
					obj.data[i * obj.nbColumns + j] = obj.data[j * this.nbColumns + i];
				}
				
				// Computation part
				for (var j = i; j < obj.nbColumns; ++j) {
					// Standard deviation of a_jj
					var stdDevJ = Math.sqrt(this.data[j * this.nbColumns + j]);
				
					obj.data[i * obj.nbColumns + j] = this.data[i * this.nbColumns + j] / ( stdDevI * stdDevJ );
				}
			}

			// Return
			return obj;
		},
		
    	/**
    	* @function getVariances
    	*
    	* @summary Returns the variances associated to a covariance matrix.
    	*
    	* @description This function returns, as a n by 1 matrix, the diagonal elements (a_ii), i=1..n from the original
    	* square matrix (a_ij),i=1..n,j=1..n.
    	*
    	* @memberof Matrix_
		* @param {Matrix_} out an optional n by 1 matrix.
    	* @return {Matrix_} a n by 1 column matrix containing the variances vector associated to the covariance matrix,
		* either stored in the matrix out or in a new matrix.
    	*
    	* @example
    	* Matrix_([[1, 1, 8.1], [1, 16, 18], [8.1, 18, 81]]).getVariances();
    	* // Matrix_([1, 16, 81])
    	*/
		'getVariances': function(out) { 
			return this.diagonal(out);
		},
		
    	/**
    	* @function getStandardDeviations
    	*
    	* @summary Returns the standard deviations associated to a covariance matrix.
    	*
    	* @description This function returns, as a n by 1 matrix, the square of the diagonal elements SQRT(a_ii), i=1..n from the original
    	* square matrix (a_ij),i=1..n,j=1..n.
    	*
    	* @memberof Matrix_
		* @param {Matrix_} out an optional n by 1 matrix.
    	* @return {Matrix_} a n by 1 column matrix containing the standard deviations vector associated to the covariance matrix,
		* either stored in the matrix out or in a new matrix.
    	*
    	* @example
    	* Matrix_([[1, 1, 8.1], [1, 16, 18], [8.1, 18, 81]]).getStandardDeviations();
    	* //  Matrix_([1, 4, 9])
    	*/
		'getStandardDeviations': function(out) { 
			return this.diagonal(out).elemMap(function(i,j,val) { return Math.sqrt(val);}, out);
		},
		
    	/**
    	* @function standardizedGeneralizedVariance
    	*
    	* @summary Returns the standardized generalized variance of a covariance matrix.
    	*
    	* @description This function computes the standardized generalized variance of a covariance matrix,
    	* as described in the reference.
    	*
    	* @see <a href="http://dx.doi.org/10.1016/0047-259X(87)90153-9">Ashis SenGupta, Tests for standardized generalized variances of multivariate normal populations of possibly different dimensions, Journal of Multivariate Analysis, Volume 23, Issue 2, 1987, Pages 209-219</a>
    	* 
    	* @memberof Matrix_
    	* @return {number} the standardized generalized variance of the covariance matrix.
    	*
    	*/
    	'standardizedGeneralizedVariance': function () {
        	// Compute the determinant of the matrix
        	var det = this.determinant();
    		
    		// Check for positivity
    		if (det < 0) {
    		    throw new Error('covariance matrix is not positive semi-definite');
    		}
    		
    		// Compute the SGV if the determinant is positive, as per the formula of the reference.
    		var sgv = Math.pow(det, 1/this.nbRows);
    		
    		// Return it
    		return sgv;
    	},
	};

  // Addition of the methods to the input matrix
  for (var name in methods) {
    matrix[name] = methods[name];
  }
};



/**
 * @file Functions related to matrix object.
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 


/**
* @function Matrix_
*
* @summary Construct a matrix object from several possible inputs: an array of arrays of numbers, an array of numbers or a matrix object.
*
* @description This function constructs an n by m matrix (a_ij),i=1..n,j=1..m from either:
* - An array dblarr of n arrays of m real numbers, with coefficients a_ij satisfying a_ij = dblarr[i-1][j-1]
* - An array arr of n real numbers, with coefficients a_ij satisfying a_ij = arr[i-1] with m=1 (i.e., the constructed matrix is a column matrix, e.g. a vector)
* - An n by m matrix (b_ij),i=1..n,j=1..m, with coefficients a_ij satisfying a_ij = b_ij
* 
* @param {Array.<Array.<number>>|<Array.<number>|Matrix_} input either an array of n arrays of m real numbers, or an array of n real numbers or a n by m matrix object,
* with n and m natural integers greater than or equal to 1.
* @return {this} the constructed matrix.
*
* @example
* new Matrix_([[1,2,3], [4,5,6]]);
*/
function Matrix_(input) {
	function fromDoubleArray(dblarr) {
		// Result matrix allocation
		that = allocateMatrix_(dblarr.length, dblarr[0].length);
	
		// Fill the matrix
		for (var i = 0; i < that.nbRows; ++i) {
			if (!(dblarr[i] instanceof Array)) {
				throw new Error('unsupported input type');
			}
			if (dblarr[i].length !== that.nbColumns) {
				throw new Error('unsupported input type');
			}
			for (var j = 0; j < that.nbColumns; ++j) {
				that.data[i * that.nbColumns + j] = dblarr[i][j];
			}
		}
		
		// Return
		return that;
	}
	
	function fromArray(arr) {
		// Result matrix allocation
		that = allocateMatrix_(arr.length, 1);
		
		// Fill the vector
		for (var i = 0; i < that.nbRows; ++i) {
			that.data[i * that.nbColumns] = arr[i];
		}
		
		// Return
		return that;
	}
	
	function fromMatrix(mat) {
		// Both steps below are delegated to the matrix copy function:
		// - Result matrix allocation
		// - Matrix copy
		that = Matrix_.copy(mat);

		// Return
		return that;
	}
	
    // Catches incorrect usage of var m = Matrix_() instead of var m = new Matrix_().
	if (!(this instanceof Matrix_)) {
      return new Matrix_(input);
    }

	// For subsequent usage in initialization sub-functions.
	var that = this;
	
	// Checks
	if (input instanceof Array && input[0] instanceof Array) { // Standard matrix
		return fromDoubleArray(input);
	}
	else if (input instanceof Array || (typeof Float64Array === 'function' && input instanceof Float64Array)) { // Simplified constructor for a column matrix (i.e., a vector)
		return fromArray(input);
	}
	else if (input instanceof Matrix_) { // Equivalent to a "clone" operation on the Matrix
		return fromMatrix(input);
	}
	else {
		throw new Error('unsupported input type');
	}
}

/**
* @function allocateMatrix_
*
* @summary Returns a matrix to be used for subsequent computations.
*
* @description This internal function centralizes the allocation of a n by m matrix to be used for
* subsequent computations.
*
* @param {number} n the number of rows of the matrix to allocate, natural integer greater than or equal to 1.
* @param {number} m the number of columns of the matrix to allocate, natural integer greater than or equal to 1.
* @param {Matrix_} out an optional n by m matrix.
* @return {Matrix_} either a newly allocated matrix if out is not provided or out if out is provided, a n by m matrix.
*
* @example
* allocateMatrix_(2, 3);
*/
function allocateMatrix_(n, m, out) {
	// The logic of the matrix allocation is the following:
	// - If no output matrix is provided, a new n by m matrix is created
	// - If an output is provided, it is checked to be a matrix with proper dimensions, and if, it is re-used
	var obj;
	if (out === undefined) {
    	obj = Object.create(Matrix_.prototype);
    	obj.nbRows = n;
    	obj.nbColumns = m;
    	obj.data = typeof Float64Array === 'function' ? new Float64Array(obj.nbRows * obj.nbColumns) : new Array(obj.nbRows * obj.nbColumns);
	}
	else if (!(out instanceof Matrix_)){
		throw new Error('provided output must be a matrix');
	}
	else if (out.nbRows !== n || out.nbColumns !== m) {
		throw new Error('provided output matrix size does not match expected matrix size: ' + '(' + out.nbRows + ',' + out.nbColumns + 
		') v.s. ' + '(' + n + ',' + m + ')');
	}
	else {
		obj = out;
	}
	
	// Return the allocated matrix
	return obj;
}


Matrix_.prototype = {
    constructor: Matrix_,
  
	/**
	* @function toString
	*
	* @summary Returns a string representation of the matrix.
	*
	* @description This function builds a readable string representation of the matrix, with automatically adjusted padding.
	* 
	* @memberof Matrix_
	* @return {string} a string representation of the matrix' contents.
	*
	* @example
	* Matrix_([[1,2,3], [4,5,10]]).toString();
	* //
	* [  1  2  3 ]
    * [  4  5 10 ]
	*/
	toString: function() {
		// Calculate a correct padding for the display of the matrix
		var maxLen = 0;
		for (var i = 0; i < this.nbRows; ++i) {
			for (var j=0; j < this.nbColumns; ++j) {
				var len = String(this.data[i * this.nbColumns + j]).length;
				if (len > maxLen) {
					maxLen = len;
				}
			}
		}
		
		// Build the string representation of the matrix
		var strMat = [];
		for (var i = 0; i < this.nbRows; ++i) {
			strMat.push('[ ');
			
			for (var j=0; j < this.nbColumns; ++j) {
				var strVal = String(this.data[i * this.nbColumns + j]);
				strMat.push(new Array(maxLen - strVal.length + 1).join(' ') + strVal + ' ');
			}
			
			strMat.push(']\n');
		}
		
		// Return it
		return strMat.join('');
	},
	
	
	/**
	* @function toRowArray
	*
	* @summary Returns a double array containing all the elements of the matrix satisfying a predicate function,
	* organized by row.
	*
	* @description This function builds a double array arr from the matrix (a_ij),i=1..nbRows,j=1..nbColumns with arr[i-1] 
	* containing all the elements a_ij,j=1..nbColumns of the i-th row of the matrix satisfying fct(i, j, a_ij) == true
	* where fct is an optional predicate function.
	*
	* In case fct is not provided, it defaults to true, i.e., all the elements of the matrix are selected.
	* 
	* @memberof Matrix_
	* @param {function(number, number, number): number} fct the optional function to call on each element of the original matrix,
	* which should take 3 arguments: row index i=1..n, column index j=1..m, matrix element a_ij and which
	* should return a boolean, true in order to include the element a_ij in the output double array, false to skip it.
	* @return {Array.<Array.<number>>} an array of array of real numbers, representing the matrix' elements selected by the function fct.
	*
	* @example
	* Matrix_([[1,2,3], [4,5,10]]).toRowArray();
	* //
	* [[1,2,3], [4,5,10]]
	*/
	toRowArray: function(fct) {
		// In case the function is not provided
		fct = fct || function(i, j, val) { return true; };
		
		// Allocate the outer array
		var arr = new Array(this.nbRows);
		
		// Fill it with matching matrix elements
		for (var i = 0; i < this.nbRows; ++i) {
			// Allocate the inner array
			arr[i] = new Array(this.nbColumns); // potential size, to be restrained after
			
			var k =0;
			for (var j=0; j < this.nbColumns; ++j) {
				var val = this.data[i * this.nbColumns + j];
				if (fct(i+1, j+1, val)) {
					arr[i][k++] = val;
				}
			}			
			arr[i].length = k; // Restrain the inner array size to effectively matching elements
		}
		
		// Return it
		return arr;
	},
	
	
	/**
	* @function toArray
	*
	* @summary Returns an array containing all the elements of the matrix satisfying a predicate function.
	*
	* @description This function builds an array arr from the matrix (a_ij),i=1..nbRows,j=1..nbColumns
	* containing all the elements a_ij,i=1..nbRows,j=1..nbColumns of the matrix satisfying fct(i, j, a_ij) == true
	* where fct is an optional predicate function.
	*
	* In case fct is not provided, it defaults to true, i.e., all the elements of the matrix are selected.
	*
	* The order of the elements inside the array arr follows a row major organisation.
	* 
	* @memberof Matrix_
	* @param {function(number, number, number): number} fct the optional function to call on each element of the original matrix,
	* which should take 3 arguments: row index i=1..n, column index j=1..m, matrix element a_ij and which
	* should return a boolean, true in order to include the element a_ij in the output array, false to skip it.
	* @return {<Array.<number>} an array of real numbers, representing the matrix' elements selected by the function fct.
	*
	* @example
	* Matrix_([[1,2,3], [4,5,10]]).toArray();
	* //
	* [1,2,3,4,5,10]
	*/
	toArray: function(fct) {
		// In case the function is not provided
		fct = fct || function(i, j, val) { return true; };
		
		// Allocate the array
		var arr = new Array(this.nbRows * this.nbColumns);
		
		// Fill it with matching matrix elements
		var k =0;
		for (var i = 0; i < this.nbRows; ++i) {
			for (var j=0; j < this.nbColumns; ++j) {
				var val = this.data[i * this.nbColumns + j];
				if (fct(i+1, j+1, val)) {
					arr[k++] = val;
				}
			}			
		}
		arr.length = k; // Restrain the array size to effectively matching elements
		
		// Return it
		return arr;
	},
	
	
	/**
	* @function setValueAt
	*
	* @summary Sets the matrix coefficient at row i, column j.
	*
	* @description This function sets the matrix coefficient at row i, column j to the value val, with i belonging to 1..number of matrix rows,
	* and j belonging to 1..number of matrix columns, checking bounds.
	* 
	* @memberof Matrix_
	* @param {number} i the row index, natural integer belonging to 1..number of matrix rows
	* @param {number} j the column index, natural integer belonging to 1..number of matrix columns.
	* @param {number} val the value to set at row index i and column index j.
	* @return {this} the updated matrix.
	*
	* @example
	* Matrix_([[1,2,3], [4,5,10]]).setValueAt(1,1,9).toString();
	* //
	* [  9  2  3 ]
    * [  4  5 10 ]
	*/
	setValueAt: function(i, j, val) {
		// Bounds check
		if (i < 1 || j < 1 || i > this.nbRows || j > this.nbColumns) {
			throw new Error(
			'index out of bounds when setting matrix value, (' + i + ',' + j +
			') in size (' + this.nbRows + ',' + this.nbColumns + ')');
		}
		
		// Value setting
		this.data[(i-1) * this.nbColumns + (j-1)] = val;
		return this;
	},
	
	
	/**
	* @function setValue
	*
	* @summary Sets the matrix coefficient at row i, column j.
	*
	* @description This function sets the matrix coefficient at row i, column j to the value val, with i belonging to 1..number of matrix rows,
	* and j belonging to 1..number of matrix columns.
	* 
	* @memberof Matrix_
	* @param {number} i the row index, natural integer belonging to 1..number of matrix rows
	* @param {number} j the column index, natural integer belonging to 1..number of matrix columns.
	* @param {number} val the value to set at row index i and column index j.
	* @return {this} the updated matrix.
	*
	* @example
	* Matrix_([[1,2,3], [4,5,10]]).setValueAt(1,1,9).toString();
	* //
	* [  9  2  3 ]
    * [  4  5 10 ]
	*/
	setValue: function(i, j, val) {
		// Value setting
		this.data[(i-1) * this.nbColumns + (j-1)] = val;
		return this;
	},
	
	
	/**
	* @function getValueAt
	*
	* @summary Gets the matrix coefficient at row i, column j.
	*
	* @description This function gets the matrix coefficient at row i, column j, with i belonging to 1..number of matrix rows,
	* and j belonging to 1..number of matrix columns, checking bounds.
	* 
	* @memberof Matrix_
	* @param {number} i the row index, natural integer belonging to 1..number of matrix rows
	* @param {number} j the column index, natural integer belonging to 1..number of matrix columns.
	* @return {number} the value of the matrix coefficient at row i, column j.
	*
	* @example
	* Matrix_([[1,2,3], [4,5,10]]).getValueAt(1,1);
	* // 1
	*/
	getValueAt: function(i, j) {
		// Bounds check
		if (i < 1 || j < 1 || i > this.nbRows || j > this.nbColumns) {
			throw new Error(
			'index out of bounds when getting matrix value, (' + i + ',' + j +
			') in size (' + this.nbRows + ',' + this.nbColumns + ')');
		}
		
		// Value getting
		return this.data[(i-1) * this.nbColumns + (j-1)];
	},
	
	
	/**
	* @function getValue
	*
	* @summary Gets the matrix coefficient at row i, column j.
	*
	* @description This function gets the matrix coefficient at row i, column j, with i belonging to 1..number of matrix rows,
	* and j belonging to 1..number of matrix columns.
	* 
	* @memberof Matrix_
	* @param {number} i the row index, natural integer belonging to 1..number of matrix rows
	* @param {number} j the column index, natural integer belonging to 1..number of matrix columns.
	* @return {number} the value of the matrix coefficient at row i, column j.
	*
	* @example
	* Matrix_([[1,2,3], [4,5,10]]).getValue(1,1);
	* // 1
	*/
	getValue: function(i, j) {
		// Value getting
		return this.data[(i-1) * this.nbColumns + (j-1)];
	},	

	
	/**
	* @function isSquare
	*
	* @summary Determines if the matrix is square.
	*
	* @description This function determines if the number of rows of the matrix
	* is equal to the number of columns of the matrix.
	* 
	* @memberof Matrix_
	* @return {boolean} true if the matrix is square, false otherwise.
	*
	* @example
	* Matrix_([[1,2,3], [4,5,10]]).isSquare();
	* // false
	*
	* @example
	* Matrix_([[1,2], [4,5]]).isSquare();
	* // true
	*/
	isSquare: function() {
	    return this.nbRows === this.nbColumns;
	},
	
	/**
	* @function isSymmetric
	*
	* @summary Determines if the matrix is symmetric.
	*
	* @description This function determines if the matrix (a_ij), i=1..m,j=1..n 
	* is numerically symmetric, that is, if (a_ij) is square and 
	* a_ij = a_ji +- eps, i=1..m, j=1..n.
	* 
	* @memberof Matrix_
	* @param {number} eps, an optional real number; by default, eps is equal to zero.
	*
	* @return {boolean} true if the matrix is symmetric, false otherwise.
	*
	* @example
	* Matrix_([[1,2,3], [4,5,10]]).isSymmetric();
	* // false
	*
	* @example
	* Matrix_([[1,2], [2,1]]).isSymmetric();
	* // true
	*/
	isSymmetric: function(eps) {
		// Decode the numerical precision
		if (eps == undefined) {
			eps = 0;
		}	
		
		// Preliminary check, the matrix must be square
		if (!this.isSquare()) {
			return false;
		}
		
		// Core loop, checking that a_ij = a_ji +- eps
		for (var i = 0; i < this.nbRows; ++i) {
			for (var j = 0; j < this.nbColumns; ++j) {
				if (Math.abs(this.data[i * this.nbColumns + j] - this.data[j * this.nbColumns + i]) > eps) {
					return false;
				}
			}
		}
		
		// Arrived here, the matrix is symmetric
	    return true;
	},

	/**
	* @function isVector
	*
	* @summary Determines if the matrix is a vector.
	*
	* @description This function determines if the number of columns of the matrix is equal to 1.
	* 
	* @memberof Matrix_
	* @return {boolean} true if the matrix is a vector, false otherwise.
	*
	* @example
	* Matrix_([[1,2,3], [4,5,10]]).isVector();
	* // false
	*
	* @example
	* Matrix_([[1], [4]]).isVector();
	* // true
	*/
	isVector: function() {
	    return this.nbColumns === 1;
	},
	
	/**
	* @function isNonNegative
	*
	* @summary Determines if the matrix is a nonnegative matrix.
	*
	* @description This function determines if the matrix is a nonnegative matrix,
    * i.e. if all its elements are equal to or greater than zero.
	* 
	* @see <a href="https://en.wikipedia.org/wiki/Nonnegative_matrix">Nonnegative matrix</a>
	*
	* @memberof Matrix_
	* @return {boolean} true if the matrix is a nonnegative matrix, false otherwise.
	*
	* @example
	* Matrix_([[1,2,3], [4,5,10]]).isNonNegative();
	* // true
	*
	* @example
	* Matrix_([[-1], [4]]).isNonNegative();
	* // false
	*/
	isNonNegative: function() {
		// Check the nonnegativity condition element by element
		for (var i = 0; i < this.nbRows; ++i) {
			for (var j = 0; j < this.nbColumns; ++j) {
				if (this.data[i * this.nbColumns + j] < 0) {
					return false;
				}
			}
		}
		
		// At this stage, the matrix is nonnegative.
		return true;
	},
	
	/**
	* @function isPositive
	*
	* @summary Determines if the matrix is a positive matrix.
	*
	* @description This function determines if the matrix is a positive matrix,
    * i.e. if all its elements are strictly greater than zero.
	* 
	* @see <a href="https://en.wikipedia.org/wiki/Nonnegative_matrix">Nonnegative matrix</a>
	*
	* @memberof Matrix_
	* @return {boolean} true if the matrix is a positive matrix, false otherwise.
	*
	* @example
	* Matrix_([[1,2,3], [4,5,10]]).isPositive();
	* // true
	*
	* @example
	* Matrix_([[0], [4]]).isPositive();
	* // false
	*/
	isPositive: function() {
		// Check the positivity condition element by element
		for (var i = 0; i < this.nbRows; ++i) {
			for (var j = 0; j < this.nbColumns; ++j) {
				if (this.data[i * this.nbColumns + j] <= 0) {
					return false;
				}
			}
		}
		
		// At this stage, the matrix is positive.
		return true;
	},

	/**
	* @function isNonPositive
	*
	* @summary Determines if the matrix is a nonpositive matrix.
	*
	* @description This function determines if the matrix is a nonpositive matrix,
    * i.e. if all its elements are equal to or lower than zero.
	* 
	* @see <a href="http://mathworld.wolfram.com/NonpositiveMatrix.html"> Weisstein, Eric W. "Nonpositive Matrix." From MathWorld--A Wolfram Web Resource. http://mathworld.wolfram.com/NonpositiveMatrix.html </a>
	*
	* @memberof Matrix_
	* @return {boolean} true if the matrix is a nonpositive matrix, false otherwise.
	*
	* @example
	* Matrix_([[1,2,3], [4,5,10]]).isNonPositive();
	* // false
	*
	* @example
	* Matrix_([[-1], [0]]).isNonPositive();
	* // true
	*/
	isNonPositive: function() {	
		// Check the nonpositivity condition element by element
		for (var i = 0; i < this.nbRows; ++i) {
			for (var j = 0; j < this.nbColumns; ++j) {
				if (this.data[i * this.nbColumns + j] > 0) {
					return false;
				}
			}
		}
		
		// At this stage, the matrix is nonpositive.
		return true;
	},
	
	/**
	* @function isNegative
	*
	* @summary Determines if the matrix is a negative matrix.
	*
	* @description This function determines if the matrix is a negative matrix,
    * i.e. if all its elements are strictly lower than zero.
	* 
	* @see <a href="http://mathworld.wolfram.com/NegativeMatrix.html">Weisstein, Eric W. "Negative Matrix." From MathWorld--A Wolfram Web Resource. http://mathworld.wolfram.com/NegativeMatrix.html </a>
	*
	* @memberof Matrix_
	* @return {boolean} true if the matrix is a negative matrix, false otherwise.
	*
	* @example
	* Matrix_([[1,2,3], [4,5,10]]).isNegative();
	* // false
	*
	* @example
	* Matrix_([[-1], [-2]]).isNegative();
	* // true
	*/
	isNegative: function() {
		// Check the negativity condition element by element
		for (var i = 0; i < this.nbRows; ++i) {
			for (var j = 0; j < this.nbColumns; ++j) {
				if (this.data[i * this.nbColumns + j] >= 0) {
					return false;
				}
			}
		}
		
		// At this stage, the matrix is negative.
		return true;
	},
	
	/**
	* @function sum
	*
	* @summary Returns the sum of the elements of the matrix.
	*
	* @description This function computes the sum of the elements of the matrix.
	* 
	* @memberof Matrix_
	* @return {number} the sum of the elements of the matrix.
	*
	* @example
	* Matrix_([[1,2,3]]).sum();
	* // 6
	*/
	sum: function() {
		// Computation of sum a_ij, i=1..nbRows, j=1..nbColumns
		var sum = 0;
		for (var k = 0; k < this.data.length; ++k) {
			sum += this.data[k];
		}
		
		// Return the computed value
		return sum;
	},
	
	/**
	* @function min
	*
	* @summary Returns the minimum element of the matrix.
	*
	* @description This function computes the minimum element of the matrix.
	* 
	* @memberof Matrix_
	* @return {number} the minimum element of the matrix.
	*
	* @example
	* Matrix_([[1,2,3]]).min();
	* // 1
	*/
	min: function() {
		// Computation of the minimum of a_ij, i=1..nbRows, j=1..nbColumns
		var minVal = Number.POSITIVE_INFINITY;
		for (var k = 0; k < this.data.length; ++k) {
		  if (this.data[k] < minVal) {
			minVal = this.data[k];
		  }
		}

		// Return the computed value
		return minVal;
	},
	
	/**
	* @function max
	*
	* @summary Returns the maximum element of the matrix.
	*
	* @description This function computes the maximum element of the matrix.
	* 
	* @memberof Matrix_
	* @return {number} the maximum element of the matrix.
	*
	* @example
	* Matrix_([[1,2,3]]).max();
	* // 3
	*/
	max: function() {
		// Computation of the maximum of a_ij, i=1..nbRows, j=1..nbColumns
		var maxVal = Number.NEGATIVE_INFINITY;
		for (var k = 0; k < this.data.length; ++k) {
		  if (this.data[k] > maxVal) {
			maxVal = this.data[k];
		  }
		}

		// Return the computed value
		return maxVal;
	},
	
	/**
	* @function normalize
	*
	* @summary Returns a matrix made of the elements of the original matrix divided by their common sum.
	*
	* @description This function computes a matrix (c_ij),i=1..n,j=1..m with elements c_ij satisfying c_ij = a_ij/(sum(a_kl),k=1..n,l=1..m),i=1..n,j=1..m, 
	* with n the number of rows of the original matrix and m the number of columns of the original matrix.
	* 
	* @memberof Matrix_
	* @param {Matrix_} out an optional n by m matrix.
	* @return {Matrix_} the normalized n by m matrix matrix, either stored in the matrix out or in a new matrix.
	*
	* @example
	* Matrix_([[1,2,3]]).normalize();
	* // Matrix_([[1/6,1/3,1/2]])
	*/
	normalize: function(out) {
		// Result matrix allocation
		var obj = allocateMatrix_(this.nbRows, this.nbColumns, out);
		
		// Computation of the sum of the matrix elements
		var sum = this.sum();
		if (sum === 0.0) {
			throw new Error('sum of coefficients of matrix is null');
		}
		
		// Normalization of the matrix
		for (var k = 0; k < this.data.length; ++k) {
			obj.data[k] = this.data[k] / sum; 
		}
		
		// Return the computed matrix
		return obj;
	},
	
	/**
	* @function diagonal
	*
	* @summary Returns the diagonal elements of a square matrix.
	*
	* @description This function returns, as a column matrix (i.e., vector) of n elements, 
	* the diagonal elements (a_ii), i=1..n from the original square matrix (a_ij),i=1..n,j=1..n.
	*
	* @memberof Matrix_
	* @param {Matrix_} out an optional n by 1 matrix.
	* @return {Matrix_} a n by 1 matrix (i.e., vector) containing the diagonal elements of the original matrix, 
	* either stored in the matrix out or in a new matrix.
	*
	* @example
	* Matrix_([[1,2], [4,5]]).diagonal();
	* // Matrix_([1,5])
	*/
    diagonal: function (out) {
    	// Checks
    	if (!this.isSquare()) {
    		throw new Error('matrix is not square: ' + '(' + this.nbRows + ',' + this.nbColumns + ')');
    	}
    	
		// Result matrix allocation
		var obj = allocateMatrix_(this.nbRows, 1, out);
    	
    	// Extraction of diagonal elements of A
    	for (var i = 0; i < this.nbRows; ++i) {
    		obj.data[i] = this.data[i * (this.nbColumns + 1)] ;
    	}
    	
    	// Return the computed vector
        return obj;
    },
	
	/**
	* @function row
	*
	* @summary Returns the row elements of a matrix.
	*
	* @description This function returns, as a m by 1 matrix, 
	* the row elements (a_ij), j=1..m from the original matrix (a_ij),i=1..n,j=1..m.
	*
	* @memberof Matrix_
	* @param {number} i the row index of the matrix for which to return the elements, a natural integer belonging to 1..number of matrix rows.
	* @param {Matrix_} out an optional m by 1 matrix.
	* @return {Matrix_} a m by 1 matrix (i.e., vector) containing the elements of the i-th row of the original matrix, 
	* either stored in the matrix out or in a new matrix.
	*
	* @example
	* Matrix_([[1,2], [4,5]]).row(1);
	* // Matrix_([1,2])
	*/
    row: function (i, out) {
		// Bounds check
		if (i < 1 || i > this.nbRows) {
			throw new Error(
			'index out of bounds when getting matrix row, (' + i + 
			') in size (' + this.nbRows + ',' + this.nbColumns + ')');
		}
    	
    	// Result matrix allocation
		var obj = allocateMatrix_(this.nbColumns, 1, out);
		
    	// Extraction of the elements of the i-th row of A
    	for (var j = 0; j < this.nbColumns; ++j) {
    		obj.data[j] = this.data[(i-1) * this.nbColumns + j] ;
    	}
    	
    	// Return the computed vector
        return obj;
    },
	
	/**
	* @function column
	*
	* @summary Returns the column elements of a matrix.
	*
	* @description This function returns, as a n by 1 matrix, 
	* the column elements (a_ij), i=1..n from the original matrix (a_ij),i=1..n,j=1..m.
	*
	* @memberof Matrix_
	* @param {number} j the column index of the matrix for which to return the elements, a natural integer belonging to 1..number of matrix columns.
	* @param {Matrix_} out an optional n by 1 matrix.
	* @return {Matrix_} a n by 1 matrix (i.e., vector) containing the elements of the i-th row of the original matrix, 
	* either stored in the matrix out or in a new matrix.
	*
	* @example
	* Matrix_([[1,2], [4,5]]).column(1);
	* // Matrix_([1,4])
	*/
    column: function (j, out) {
		// Bounds check
		if (j < 1 || j > this.nbColumns) {
			throw new Error(
			'index out of bounds when getting matrix column, (' + j + 
			') in size (' + this.nbRows + ',' + this.nbColumns + ')');
		}
    	
    	// Result matrix allocation
		var obj = allocateMatrix_(this.nbRows, 1, out);
		
    	// Extraction of the elements of the j-th column of A
    	for (var i = 0; i < this.nbRows; ++i) {
    		obj.data[i] = this.data[i * this.nbColumns + (j-1)] ;
    	}
    	
    	// Return the computed vector
        return obj;
    },
    
    /**
	* @function elemMap
	*
	* @summary Returns a matrix made of the elements of the original matrix transformed by a function.
	*
	* @description This function computes a matrix (c_ij),i=1..n,j=1..m from the original matrix (a_ij),i=1..n,j=1..m, with coefficients
	* satisfying c_ij = fct(a_ij).
	*
	* @memberof Matrix_
	* @param {function(number, number, number): number} fct the function to call on each element of the original matrix,
	* which should take 3 arguments: row index i=1..n, column index j=1..m, original matrix element a_ij and which
	* should return a number, which will be inserted into the new matrix.
	* @param {Matrix_} out an optional n by m matrix.
	* @return {Matrix_} a n by m matrix with the original matrix coefficients transformed by the function fct,
	* either stored in the matrix out or in a new matrix.
	*
	* @example
	* Matrix_([[1,2,3], [4,5,6]]).elemMap(function(i,j,val) { return i+j;});
	* // Matrix_([[2,3,4], [3,4,5]])
	*/
	elemMap: function (fct, out) {
		// Result matrix allocation
		var obj = allocateMatrix_(this.nbRows, this.nbColumns, out);
		
		// Computation of the function fct applied to the coefficients of A
		for (var i = 0; i < obj.nbRows; ++i) {
			for (var j = 0; j < obj.nbColumns; ++j) {
				obj.data[i * obj.nbColumns + j] = fct(i+1, j+1, this.data[i * this.nbColumns + j]);
			}
		}
		
		// Return the computed matrix
		return obj;
	},
	
    /**
	* @function submatrix
	*
	* @summary Returns a (possibly non contiguous) submatrix from the original matrix, keeping the elements whose row and column indexes are specified.
	*
	* @description This function computes a matrix (c_ij),i=1..p,j=1..q from the original matrix (a_ij),i=1..n,j=1..m and from the lists of row/column indexes to keep
	* rindexes/cindexes, where p is equal to the length of rindexes and q is equal to the length of cindexes, with coefficients satisfying c_ij = a_rindexes[i]cindexes[j].
	*
	* @memberof Matrix_
	* @param {Array.<number>|Uint32Array.<number>} rindexes the row indexes of the original matrix elements to keep, array of strictly increasing natural integers belonging to 1..n.
    * @param {Array.<number>|Uint32Array.<number>} cindexes the column indexes of the original matrix elements to keep, array of strictly increasing natural integers belonging to 1..m.
	* @param {Matrix_} out an optional rindexes by cindexes matrix.
	* @return {Matrix_} a rindexes by cindexes matrix whose elements correspond to the elements of the original matrix
	* whose row/column indexes belong to the input lists of row/column indexes to keep, either stored in the matrix out or in a new matrix.
	*
	* @example
	* Matrix_([[1,2,3], [4,5,6]]).submatrix([1], [2, 3]);
	* // Matrix_([[2,3]])
	*/
    submatrix : function(rindexes, cindexes, out) {
    	// Check that indexes are arrays
    	if (!(rindexes instanceof Array || rindexes instanceof Uint32Array) || rindexes.length == 0) {
    		throw new Error('first parameter must be a non empty array');
    	}
    	if (!(cindexes instanceof Array || cindexes instanceof Uint32Array) || cindexes.length == 0) {
    		throw new Error('second parameter must be a non empty array');
    	}
	
    	// Check that the indexes are sorted arrays of distinct elements
    	for (var i = 1; i < rindexes.length; ++i) {
    	    if (rindexes[i-1] >= rindexes[i]) {
    	        throw new Error('first parameter must be a sorted array');
    	    }
    	    
    	}
        for (var j = 1; j < cindexes.length; ++j) {
    	    if (cindexes[j-1] >= rindexes[j]) {
    	        throw new Error('second parameter must be a sorted array');
    	    }
    	    
    	}
    	
		// Result matrix allocation
		var obj = allocateMatrix_(rindexes.length, cindexes.length, out);
    	
    	// Computation of the elements of A
    	for (var i = 0; i < obj.nbRows; ++i) {
    		var rindex = rindexes[i] - 1; // row index of the original matrix
    		
    		for (var j = 0; j < obj.nbColumns; ++j) {
    		    var cindex = cindexes[j] - 1; // column index of the original matrix
    			obj.data[i * obj.nbColumns + j] = this.data[rindex * this.nbColumns + cindex];
    		}
    	}
    	
    	// Return the computed submatrix
        return obj;
    },
	
    /**
	* @function transpose
	*
	* @summary Returns the transpose of the original matrix.
	*
	* @description This function computes the transpose matrix (c_ij),i=1..n,j=1..m of the original matrix (a_ij),i=1..n,j=1..m,
	* with coefficients satisfying c_ij = a_ji.
	*
	* @memberof Matrix_
	* @param {Matrix_} out an optional m by n matrix.
	* @return {Matrix_} a m by n matrix, transposed of the original matrix, either stored in the matrix out or in a new matrix.
	*
	* @example
	* Matrix_([[1,2,3], [4,5,6]]).transpose();
	* // Matrix_([[1,4], [2,5], [3,6]])
	*/
	transpose: function (out) {
		// Result matrix allocation
		var obj = allocateMatrix_(this.nbColumns, this.nbRows, out);
		
		// Computation of the transpose of A
		for (var i = 0; i < obj.nbRows; ++i) {
			for (var j = 0; j < obj.nbColumns; ++j) {
				obj.data[i * obj.nbColumns + j] = this.data[j * this.nbColumns + i];
			}
		}
		
		// Return the computed transpose of A
		return obj;
	},
	
	/**
	* @function determinant
	*
	* @summary Returns the determinant of the square matrix.
	*
	* @description This function computes the determinant of the square matrix (a_ij),i=1..n,j=1..n,
	* using a QR decomposition.
	*
	* @memberof Matrix_
	* @return {number} the determinant of the matrix.
	*
	* @example
	* Matrix_([[1,2], [3,4]]).determinant();
	* // -2
	*/
	determinant: function () {
    	// Checks
    	if (!this.isSquare()) {
    		throw new Error('matrix is not square: ' + '(' + this.nbRows + ',' + this.nbColumns + ')');
    	}
		
		// Compute the (Givens) QR decomposition of the matrix, using only R.
		var R = Matrix_.qrDecomposition(this, {qLess: true});
		
		// By property of the Givens QR decomposition, the determinant of the matrix
		// is then the product of the diagonal elements of the R matrix.
		var det = 1.0;
		for (var k = 0; k < R.data.length; k += R.nbColumns + 1) {
		        det *= R.data[k];
		}

		// Return the computed determinant
		return det;
	},
	
	/**
	* @function trace
	*
	* @summary Returns the trace of the square matrix.
	*
	* @description This function computes the trace of the square matrix (a_ij),i=1..n,j=1..n.
	*
	* @memberof Matrix_
	* @return {number} the trace of the matrix.
	*
	* @example
	* Matrix_([[1,2], [3,4]]).trace();
	* // 5
	*/
	trace: function () {
    	// Checks
    	if (!this.isSquare()) {
    		throw new Error('matrix is not square: ' + '(' + this.nbRows + ',' + this.nbColumns + ')');
    	}
		
		// Compute the trace of the matrix
		var tr = 0;
		for (var i = 0; i < this.nbRows; ++i) {
			tr += this.data[i * this.nbColumns + i];
		}

		// Return the computed trace
		return tr;
	},
	
	
	/**
	* @function matrixNorm
	*
	* @summary Returns a matrix norm of the matrix.
	*
	* @description This function computes a matrix norm of the matrix, the exact norm depending on the value of the parameter p:
	* - 'one', for the matrix norm induced by the vector 1-norm (largest column sum of absolute elements)
	* - 'infinity', for the matrix norm induced by the vector infinity-norm (largest row sum of absolute elements)
	* - 'frobenius', for the matrix Frobenius norm (sqrt(trace(transpose(A) * A)))
	*
	* @see <a href="https://en.wikipedia.org/wiki/Matrix_norm">Matrix norm</a>
	*
	* @memberof Matrix_
	* @param {string} p the matrix norm to compute as detailled in the description, a string either equals to 'one', to 'infinity' or to 'frobenius'.
	* @return {number} the computed matrix norm.
	*
	* @example
	* Matrix_([[1,2], [3,4]]).matrixNorm('one');
	* // 7
	*/
	matrixNorm: function(p) {
		// The supported matrix norms are 1-norm, infinity-norm and Frobenius norm
		if (p == 'one') {
            // Compute the largest column sum of the absolute elements of the matrix
			var maxColSum = 0;
            for (var j = 0; j < this.nbColumns; ++j) {
                var colSum = 0;
			    for (var i = 0; i < this.nbRows; ++i) {
				    colSum += Math.abs(this.data[i * this.nbColumns + j]);
			     }
			     maxColSum = Math.max(maxColSum, colSum);
            }
            return maxColSum;
		}
		else if (p == 'infinity') {
			// Compute the largest row sum of the absolute elements of the matrix
		    var maxRowSum = 0;
		    for (var i = 0; i < this.nbRows; ++i) {
			    var rowSum = 0;
			    for (var j = 0; j < this.nbColumns; ++j) {
				    rowSum += Math.abs(this.data[i * this.nbColumns + j]);
			    }
			    maxRowSum = Math.max(maxRowSum, rowSum);
		    }
		    return maxRowSum;
		}
		else if (p == 'frobenius') {
			// Compute the Frobenius norm, which is equal to the l^2 vector norm of the matrix
			return this.vectorNorm('two');
		}
		else {
			throw new Error('unsupported matrix norm: ' + p);
		}
	},
	
	/**
	* @function vectorNorm
	*
	* @summary Returns a vector norm of the matrix or of a subset of the matrix.
	*
	* @description This function computes a vector norm of the matrix or of a subset of the matrix, 
	* the exact norm depending on the value of the parameter p:
	* - 'one', for the vector l^1 norm (a.k.a. Manhattan norm)
	* - 'two' for the vector l^2 norm (a.k.a. Euclidean norm)
	* - 'infinity' for the vector l^infinity norm (a.k.a. Maximum norm)
	*
	* The value of the optional parameter subset determines the subset of the matrix to consider:
	* - 'matrix', in order to compute a vector norm for the whole matrix.
	* - 'row', in order to compute a vector norm for a specific row of the matrix.
	* - 'column', in order to compute a vector norm for a specific column of the matrix.
	*
	* If the parameter subset is provided and is equal to 'row'/'column', the parameter idx corresponds
	* to the row/column index for which to compute the vector norm.
	*
	* @see <a href="https://en.wikipedia.org/wiki/Norm_(mathematics)">Norm (mathematics)</a>
	* @see Nicholas J. Higham. 2002. Accuracy and Stability of Numerical Algorithms (2nd ed.). Soc. for Industrial and Applied Math., Philadelphia, PA, USA. 
	*
	* @memberof Matrix_
	* @param {string} p the vector norm to compute, a string either equals to 'one', to 'two' or to 'infinity'.
	* @param {string} subset the subset of the matrix for which to compute the vector norm, an optional string either equals to 'matrix', 'row' or 'column'; defaults to 'matrix'.
	* @param {number} idx if subset is equal to 'row'/'column', the row/column index for which to compute the vector norm, a natural integer belonging to 1..nbRows/nbColumns.
	* @return {number} the computed vector norm.
	*
	* @example
	* Matrix_([[1,2], [3,4]]).vectorNorm('one');
	* // 10
	*
	* @example
	* Matrix_([[1,2], [3,4]]).vectorNorm('one', 'row', 1);
	* // 3
	*/
	vectorNorm: function(p, subset, idx) {
		// Initializations
		var idxStartRow;
		var idxEndRow;
		var idxStartColumn;
		var idxEndColumn;
		
		// Supported subsets are 'matrix', 'row', 'column'
		if (subset === undefined || subset == 'matrix') {
			// Indexes assignement
			idxStartRow = 0;
			idxEndRow = this.nbRows;
			idxStartColumn = 0;
			idxEndColumn = this.nbColumns;
		}
		else if (subset == 'row') {
			if (idx !== undefined) {
				// Checks
				if (idx < 1 || idx > this.nbRows) { 
					throw new Error('row index out of bounds: ' + idx);
				}

				// Indexes assignement
				idxStartRow = idx-1;
				idxEndRow = idx;
				idxStartColumn = 0;
				idxEndColumn = this.nbColumns;
			}
			else {
				throw new Error('undefined row index');
			}
		}
		else if (subset == 'column') {
			if (idx !== undefined) {
				// Checks
				if (idx < 1 || idx > this.nbColumns) { 
					throw new Error('column index out of bounds: ' + idx);
				}

				// Indexes assignement
				idxStartRow = 0;
				idxEndRow = this.nbRows;
				idxStartColumn = idx-1;
				idxEndColumn = idx;
			}
			else {
				throw new Error('undefined row index');
			}
		}
		else if (subset !== undefined) {
			throw new Error('unsupported matrix subset: ' + subset);
		}
		
		// The supported vector norms are l^1, l^2 and l^infinity norms
		if (p == 'one') {
            // Compute the sum of the absolute values of the elements of the matrix
			var absSum = 0;
			var i_m = idxStartRow * this.nbColumns; // i * this.nbColumns
			for (var i = idxStartRow; i < idxEndRow; ++i) {
			    var ij_idx = i_m + idxStartColumn;
				for (var j = idxStartColumn; j < idxEndColumn; ++j) {
					absSum += Math.abs(this.data[ij_idx]);
					ij_idx++;
				}
				i_m += this.nbColumns;
			}
			return absSum;
		}
		else if (p == 'two') {
			// Compute the l^2 vector norm using an accurate algorithm by S. J. Hammarling
			// C.f. problem 27.5 of the second reference
			var t = 0;
			var s = 1;
			var i_m = idxStartRow * this.nbColumns; // i * this.nbColumns
			for (var i = idxStartRow; i < idxEndRow; ++i) {
			    var ij_idx = i_m + idxStartColumn;
				for (var j = idxStartColumn; j < idxEndColumn; ++j) {
				    var val = this.data[ij_idx];
					var absVal = Math.abs(val);
					if (absVal != 0) {
						if (absVal > t) {
							s = 1 + s * (t/val) * (t/val);
							t = absVal;
						}
						else  {
							s = s + (val/t) * (val/t);
						}
					}
					ij_idx++;
				}
				i_m += this.nbColumns;
			}
			return t * Math.sqrt(s);
		}
		else if (p == 'infinity') {
			// Compute the largest absolute value of the elements of the matrix
		    var maxAbsVal = 0;
			var i_m = idxStartRow * this.nbColumns; // i * this.nbColumns
			for (var i = idxStartRow; i < idxEndRow; ++i) {
    		    var ij_idx = i_m + idxStartColumn;
				for (var j = idxStartColumn; j < idxEndColumn; ++j) {
					 maxAbsVal = Math.max(maxAbsVal, Math.abs(this.data[ij_idx]));
					 ij_idx++;
				}
				i_m += this.nbColumns;
			}
		    return maxAbsVal;
		}
		else {
			throw new Error('unsupported vector norm: ' + p);
		}
	},


	/**
	* @function toCovarianceMatrix
	*
	* @summary Returns the original matrix to which is added the methods of a covariance matrix.
	*
	* @description This function adds the methods of a covariance matrix to the original matrix.
	*
	* @memberof Matrix_
	* @return {Matrix_} the original matrix to which is added the methods of a covariance matrix.
	*
	* @example
	* Matrix_([[1,0.1], [0.1,1]]).toCovarianceMatrix();
	* // == Matrix_([[1,0.1], [0.1,1]]) with covariance matrix methods
	*/
	toCovarianceMatrix: function() {
		// No checks: square, symmetric, semidefinite positive, etc
		
		// Add covariance matrix methods
		addCovarianceMatrixMethods_(this);
		
		// Return it
		return this;
	},
	
	
};


/**
* @function areEqual
*
* @summary Determines if two matrices are identical.
*
* @description This function determines if two matrices a and b are identical, i.e. if a_ij == b_ij, i=1..n,j=1..m where
* n is their common number of rows and m is their common number of rows.
*
* In case an optional tolerance parameter eps is provided, the strict component by component equality condition a_ij == b_ij
* is relaxed into |a_ij - b_ij| <= eps.
* 
* @param {Matrix_} a, a matrix.
* @param {Matrix_} b, a matrix.
* @param {number} eps, an optional real number; by default, eps is equal to zero.
* @return {boolean} true if a and b are identical, false otherwise.
*
* @example
* areEqual(Matrix_([[1,2,3], [4,5,6]]), Matrix_([[1,2,3], [4,5,6]]));
* // true
*/
Matrix_.areEqual = function (a, b, eps) {
	// Ensure a,b are matrices
	if (!(a instanceof Matrix_)) {
		throw new Error('a must be a matrix');
	}
	if (!(b instanceof Matrix_)) {
		throw new Error('b must be a matrix');
	}
	
	// Easy checks
	if (a.nbRows !== b.nbRows) {
		return false;
	}
	if (a.nbColumns !== b.nbColumns) {
		return false;
	}

	// Real checks
	var nbRows = a.nbRows;
	var nbColumns = a.nbColumns;
	var nbElements = nbRows * nbColumns;
	var tol = eps || 0;
	for (var k = 0; k < nbElements; ++k) {
		if (Math.abs(a.data[k] - b.data[k]) > tol) {
			return false;
		}
	}
	
	//
	return true;
};

/**
* @function xpy
*
* @summary Returns the addition of a matrix with another matrix.
*
* @description This function computes X + Y, the addition of a n by m matrix X 
* with another n by m matrix Y.
*
* @param {Matrix_} X a n by m matrix.
* @param {Matrix_} Y a n by m matrix.
* @param {Matrix_} out an optional n by m matrix, possibly either the matrix X or the matrix Y.
* @return {Matrix_} the matrix X + Y, either stored in the matrix out or in a new matrix, an n by m matrix.
*
* @example
* xpy(Matrix_([[1,2,3], [4,5,6]]), Matrix_([[7,8,9], [10,11,12]]));
* // Matrix_([[8,10,12], [14,16,18]])
*/
Matrix_.xpy = function(X, Y, out) {
	// Ensure X, Y are matrices
	if (!(X instanceof Matrix_)) {
		throw new Error('first input must be a matrix');
	}
	if (!(Y instanceof Matrix_)) {
		throw new Error('second input must be a matrix');
	}
	
	// Ensure X,Y are compatible
	if (X.nbColumns !== Y.nbColumns || X.nbRows !== Y.nbRows) {
		throw new Error('input matrices sizes do not match: ' + '(' + X.nbRows + ',' + X.nbColumns + 
		') - ' + '(' + Y.nbRows + ',' + Y.nbColumns + ')');
	}
	
	// Result matrix allocation
	var obj = allocateMatrix_(X.nbRows, X.nbColumns, out);
	
	// Computation of X + Y
	var nbElements = X.nbRows * X.nbColumns;
	for (var k = 0; k < nbElements; ++k) {
		obj.data[k] = X.data[k] + Y.data[k];
	}
	
	// Return the computed matrix
    return obj;
};

/**
* @function xmy
*
* @summary Returns the difference of a matrix with another matrix.
*
* @description This function computes X - Y, the difference of a n by m matrix X 
* with another n by m matrix Y.
*
* @param {Matrix_} X a n by m matrix.
* @param {Matrix_} Y a n by m matrix.
* @param {Matrix_} out an optional n by m matrix, possibly either the matrix X or the matrix Y.
* @return {Matrix_} the matrix X - Y, either stored in the matrix out or in a new matrix, an n by m matrix.
*
* @example
* xmy(Matrix_([[1,2,3], [4,5,6]]), Matrix_([[7,8,9], [10,11,12]]));
* // Matrix_([[-6,-6,-6], [-6,-6,-6]])
*/
Matrix_.xmy = function(X, Y, out) {
	// Ensure X, Y are matrices
	if (!(X instanceof Matrix_)) {
		throw new Error('first input must be a matrix');
	}
	if (!(Y instanceof Matrix_)) {
		throw new Error('second input must be a matrix');
	}
	
	// Ensure X,Y are compatible
	if (X.nbColumns !== Y.nbColumns || X.nbRows !== Y.nbRows) {
		throw new Error('input matrices sizes do not match: ' + '(' + X.nbRows + ',' + X.nbColumns + 
		') - ' + '(' + Y.nbRows + ',' + Y.nbColumns + ')');
	}
	
	// Result matrix allocation
	var obj = allocateMatrix_(X.nbRows, X.nbColumns, out);
	
	// Computation of X - Y
	var nbElements = X.nbRows * X.nbColumns;
	for (var k = 0; k < nbElements; ++k) {
		obj.data[k] = X.data[k] - Y.data[k];
	}
	
	// Return the computed matrix
    return obj;
};

/**
* @function axpby
*
* @summary Returns the product of a matrix with a real number plus the product of another matrix with another real number.
*
* @description This function computes a*X + b*Y, the product of a n by m matrix X with a real number a
* added to the product of another n by m matrix Y with another real number b.
*
* @param {number} a a real number.
* @param {Matrix_} X a n by m matrix.
* @param {number} b a real number.
* @param {Matrix_} Y a n by m matrix.
* @param {Matrix_} out an optional n by m matrix, possibly either the matrix X or the matrix Y.
* @return {Matrix_} the matrix a*X + b*Y, either stored in the matrix out or in a new matrix, an n by m matrix.
*
* Note: the matrix out can safely be choosen as either the matrix X or the matrix Y, in which case this matrix
* is overwritten.
*
* @example
* axpy(-1, Matrix_([[1,2,3], [4,5,6]]), 1, Matrix_([[7,8,9], [10,11,12]]));
* // Matrix_([[6,6,6], [6,6,6]])
*/
Matrix_.axpby = function(a, X, b, Y, out) {
	// Ensure X, Y are matrices
	if (!(X instanceof Matrix_)) {
		throw new Error('first input must be a matrix');
	}
	if (!(Y instanceof Matrix_)) {
		throw new Error('second input must be a matrix');
	}
	
	// Ensure X,Y are compatible
	if (X.nbColumns !== Y.nbColumns || X.nbRows !== Y.nbRows) {
		throw new Error('input matrices sizes do not match: ' + '(' + X.nbRows + ',' + X.nbColumns + 
		') - ' + '(' + Y.nbRows + ',' + Y.nbColumns + ')');
	}
	
	// Result matrix allocation
	var obj = allocateMatrix_(X.nbRows, X.nbColumns, out);
	
	// Computation of aX + bY
	var nbElements = X.nbRows * X.nbColumns;
	for (var k = 0; k < nbElements; ++k) {
		obj.data[k] = a*X.data[k] + b*Y.data[k];
	}
	
	// Return the computed matrix
    return obj;
};


/**
* @function copy
*
* @summary Returns a copy of a matrix.
*
* @description This function builds a copy of the n by m matrix A.
*
* @param {Matrix_} A a n by m matrix.
* @param {Matrix_} out an optional n by m matrix.
* @return {Matrix_} a copy of the matrix A, either stored in the matrix out or in a new matrix, an n by m matrix
*
* @example
* copy(Matrix_([[1,2,3], [4,5,6]]));
* // Matrix_([[1,2,3], [4,5,6]])
*/
Matrix_.copy = function(A, out) {
	// Ensure A is a matrix
	if (!(A instanceof Matrix_)) {
		throw new Error('first input must be a matrix');
	}

	// Result matrix allocation
	var obj = allocateMatrix_(A.nbRows, A.nbColumns, out);

	// Copy of A into the provided out matrix
	var nbElements = A.nbRows * A.nbColumns;
	for (var k = 0; k < nbElements; ++k) {
		obj.data[k] = A.data[k];
	}
	
	// Return the computed matrix
	return obj;
};



/**
* @function elementwiseProduct
*
* @summary Returns the element wise product of a matrix with another matrix.
*
* @description This function computes the element wise product Z = X.*Y of a matrix X with another matrix Y,
* where X is a n by m matrix and Y is either a n by m matrix (full matrix element wise product), or
* a n by 1 matrix (row matrix element wise product) or a 1 by m matrix (column matrix element wise product).
*
* When used with an n by 1 matrix Y, this function mimics the behavior of a left multiplication of X with
* a diagonal n by n matrix Diag(Y): Z = Diag(Y) * X.
*
* When used with an 1 by m matrix Y, this function mimics the behavior of a right multiplication of X with
* a diagonal m by m matrix Diag(Y): Z = X * Diag(Y).
*
* @param {Matrix_} X a n by m matrix.
* @param {Matrix_} Y a n by m matrix, or a n by 1 matrix or a 1 by m matrix.
* @param {Matrix_} out an optional n by m matrix.
* @return {Matrix_} the matrix element wise product A.*B, either stored in the matrix out or in a new matrix, a n by m matrix.
*
* @example
* elementwiseProduct(Matrix_([[1,2,3], [4,5,6]]), Matrix_([[1,2,3]]));
* // Matrix_([[1,4,9], [4,10,18]])
*/
Matrix_.elementwiseProduct = function(X, Y, out) {
	// Ensure X, Y are matrices
	if (!(X instanceof Matrix_)) {
		throw new Error('first input must be a matrix');
	}
	if (!(Y instanceof Matrix_)) {
		throw new Error('second input must be a matrix');
	}
	
	// Ensure X,Y are compatible
	if (!(X.nbRows === Y.nbRows && X.nbColumns === Y.nbColumns || 
		  Y.nbRows === X.nbRows && Y.nbColumns === 1 ||
		  Y.nbRows === 1 && Y.nbColumns === X.nbColumns)) {
		throw new Error('input matrices sizes do not match: ' + '(' + X.nbRows + ',' + X.nbColumns + 
		') - ' + '(' + Y.nbRows + ',' + Y.nbColumns + ')');
	}
	
	// Result matrix allocation
	var obj = allocateMatrix_(X.nbRows, X.nbColumns, out);
	
	// Computation of X.*Y
	var nbRows = X.nbRows;
	var nbColumns = X.nbColumns;
	if (X.nbRows === Y.nbRows && X.nbColumns === Y.nbColumns) { // full matrix elementwise product	
		var nbElements = nbRows * nbColumns;
		for (var k = 0; k < nbElements; ++k) {
			obj.data[k] = X.data[k] * Y.data[k];
		}
	}
	else if (Y.nbRows === X.nbRows && Y.nbColumns === 1) { // row matrix elementwise product
		var x_ij_idx = 0;
		for (var i = 0; i < nbRows; ++i) {
			var y_i = Y.data[i];
			for (var j = 0; j < nbColumns; ++j) {
				obj.data[x_ij_idx] = X.data[x_ij_idx] * y_i;
				x_ij_idx++;
			}
		}
	}
	else if (Y.nbRows === 1 && Y.nbColumns === X.nbColumns) { // column matrix elementwise product
		var x_ij_idx = 0;
		for (var i = 0; i < nbRows; ++i) {
			for (var j = 0; j < nbColumns; ++j) {
				obj.data[x_ij_idx] = X.data[x_ij_idx] * Y.data[j];
				x_ij_idx++
			}
		}
	}
	
	// Return the computed matrix
    return obj;
};




/**
* @function xy
*
* @summary Returns the product of a matrix with another matrix.
*
* @description This function computes X*Y, the product of a n by m matrix X with another m by p matrix Y.
*
* @param {Matrix_} X a n by m matrix.
* @param {Matrix_} Y a m by p matrix.
* @param {Matrix_} out an optional n by p matrix.
* @return {Matrix_} the matrix X*Y, either stored in the matrix out or in a new matrix, a n by p matrix.
*
* @example
* xy(Matrix_([[1,2,3], [4,5,6]]), Matrix_([[1,1], [2,2], [3,3]]));
* // Matrix_([[14,14], [32,32]])
*/
Matrix_.xy = function(X, Y, out) {
	// Ensure X, Y are matrices
	if (!(X instanceof Matrix_)) {
		throw new Error('first input must be a matrix');
	}
	if (!(Y instanceof Matrix_)) {
		throw new Error('second input must be a matrix');
	}
	
	// Checks
	if (X.nbColumns !== Y.nbRows) {
		throw new Error('matrices sizes do not match: ' + '(' + X.nbRows + ',' + Y.nbColumns + 
		') - ' + '(' + Y.nbRows + ',' + Y.nbColumns + ')');
	}
	
	// Result matrix allocation
	var obj = allocateMatrix_(X.nbRows, Y.nbColumns, out);

	// Computation of X*Y product in IKJ format
	var n = X.nbRows;
	var m = X.nbColumns;
	var p = Y.nbColumns;
	
	var x_ik_idx = 0;
	var i_p = 0; // == i*p
	for (var i = 0; i < n; ++i) {
		var obj_ij_idx = i_p;
		for (var j = 0; j < p; ++j) {
			obj.data[obj_ij_idx] = 0; // obj(i,j) = 0
			obj_ij_idx++;
		}
	
		var y_kj_idx = 0;
		for (var k = 0; k < m; ++k) {
			var x_ik = X.data[x_ik_idx]; // x(i,k)
			
			obj_ij_idx = i_p;
			for (var j = 0; j < p; ++j) {
				obj.data[obj_ij_idx] += x_ik * Y.data[y_kj_idx]; // obj(i,j) += x(i,k) * y(k,j);
				y_kj_idx++;
				obj_ij_idx++;
			}
			x_ik_idx++;
		}
		i_p += p;
	}
	
	// Return the computed matrix
    return obj;
};


/**
* @function txy
*
* @summary Returns the product of the transpose of a matrix with another matrix.
*
* @description This function computes X^t*Y, the product of the transpose of 
* a m by n matrix X with another m by p matrix Y.
*
* @param {Matrix_} X a m by n matrix.
* @param {Matrix_} Y a m by p matrix.
* @param {Matrix_} out an optional n by p matrix.
* @return {Matrix_} the matrix X^t*Y, either stored in the matrix out or in a new matrix, a n by p matrix.
*
* @example
* txy(Matrix_([[1,4], [2,5], [3,6]]), Matrix_([[1,1], [2,2], [3,3]]));
* // Matrix_([[14,14], [32,32]])
*/
Matrix_.txy = function(X, Y, out) {
	// Ensure X, Y are matrices
	if (!(X instanceof Matrix_)) {
		throw new Error('second input must be a matrix');
	}
	if (!(Y instanceof Matrix_)) {
		throw new Error('third input must be a matrix');
	}
	
	// Checks
	if (X.nbRows !== Y.nbRows) {
		throw new Error('matrices sizes do not match: ' + '(' + X.nbRows + ',' + Y.nbColumns + 
		') - ' + '(' + Y.nbRows + ',' + Y.nbColumns + ')');
	}

	// Result matrix allocation
	var obj = allocateMatrix_(X.nbColumns, Y.nbColumns, out);

	// Computation of X*Y product in KIJ format due to X being used in
	// transposed form
	var n = X.nbColumns;
	var m = X.nbRows;
	var p = Y.nbColumns;
	
	var x_ki_idx = 0;
	var obj_ij_idx = 0;
	
	// First k loop unrolled to initialize the matrix with zeros
	var k = 0;
	for (var i = 0; i < n; ++i) {
		var x_ki = X.data[x_ki_idx]; // x(k,i)
		var y_kj_idx = k_p;
		for (var j = 0; j < p; ++j) {
			obj.data[obj_ij_idx] = x_ki * Y.data[j]; // obj(i,j) = x(k,i) *y(k,j)
			obj_ij_idx++;
		}
		x_ki_idx++;
	}
	
	var k_p = p; // == k*p
    for (var k = 1; k < m; ++k) {
        obj_ij_idx = 0;
		for (var i = 0; i < n; ++i) {
            var x_ki = X.data[x_ki_idx];  // x(k,i)
			var y_kj_idx = k_p;
			for (var j = 0; j < p; ++j) {
                obj.data[obj_ij_idx] += x_ki * Y.data[y_kj_idx]; // obj(i,j) = x(k,i) *y(k,j)
				obj_ij_idx++;
				y_kj_idx++;
            }
			x_ki_idx++;
        }
		k_p += p;
    }

	// Return the computed matrix
    return obj;
};

/**
* @function axy
*
* @summary Returns the product of a matrix with a real number and with another matrix.
*
* @description This function computes a*X*Y, the product of a n by m matrix X with a real number a
* and with another m by p matrix Y.
*
* @param {number} a a real number.
* @param {Matrix_} X a n by m matrix.
* @param {Matrix_} Y a m by p matrix.
* @param {Matrix_} out an optional n by p matrix.
* @return {Matrix_} the matrix a*X*Y, either stored in the matrix out or in a new matrix, a n by p matrix.
*
* @example
* axy(Matrix_(1, [[1,2,3], [4,5,6]]), Matrix_([[1,1], [2,2], [3,3]]));
* // Matrix_([[14,14], [32,32]])
*/
Matrix_.axy = function(a, X, Y, out) {
	// Ensure X, Y are matrices
	if (!(X instanceof Matrix_)) {
		throw new Error('second input must be a matrix');
	}
	if (!(Y instanceof Matrix_)) {
		throw new Error('third input must be a matrix');
	}
	
	// Checks
	if (X.nbColumns !== Y.nbRows) {
		throw new Error('matrices sizes do not match: ' + '(' + X.nbRows + ',' + Y.nbColumns + 
		') - ' + '(' + Y.nbRows + ',' + Y.nbColumns + ')');
	}
	
	// Result matrix allocation
	var obj = allocateMatrix_(X.nbRows, Y.nbColumns, out);

	// Computation of a*X*Y product in IKJ format
	var n = X.nbRows;
	var m = X.nbColumns;
	var p = Y.nbColumns;
	
	var x_ik_idx = 0;
	var i_p = 0; // == i*p
	for (var i = 0; i < n; ++i) {
		var obj_ij_idx = i_p;
		for (var j = 0; j < p; ++j) {
			obj.data[obj_ij_idx] = 0; // obj(i,j) = 0
			obj_ij_idx++;
		}
	
		var y_kj_idx = 0;
		for (var k = 0; k < m; ++k) {
			var x_ik = a * X.data[x_ik_idx]; // a * x(i,k)
			
			obj_ij_idx = i_p;
			for (var j = 0; j < p; ++j) {
				obj.data[obj_ij_idx] += x_ik * Y.data[y_kj_idx]; // obj(i,j) += x(i,k) * y(k,j);
				y_kj_idx++;
				obj_ij_idx++;
			}
			x_ik_idx++;
		}
		i_p += p;
	}
	
	// Return the computed matrix
    return obj;
};


/**
* @function ax
*
* @summary Returns the product of a matrix with a real number.
*
* @description This function computes a*X, the product of a n by m matrix X with a real number a.
*
* @param {number} a a real number.
* @param {Matrix_} X a n by m matrix.
* @param {Matrix_} out an optional n by p matrix.
* @return {Matrix_} the matrix a*X, either stored in the matrix out or in a new matrix, a n by p matrix.
*
* @example
* ax(Matrix_(2, [[1,2,3]));
* // Matrix_([2,4,6])
*/
Matrix_.ax = function(a, X, out) {
	// Ensure X is a matrix
	if (!(X instanceof Matrix_)) {
		throw new Error('second input must be a matrix');
	}
		
	// Result matrix allocation
	var obj = allocateMatrix_(X.nbRows, X.nbColumns, out);

	// Computation of the a*X product
	var n = X.nbRows;
	var m = X.nbColumns;
	
	for (var i = 1; i <= n; ++i) {
		for (var j = 1; j <= m; ++j) {
			obj.setValue(i, j,
			             a * X.getValue(i, j));
		}
	}
	
	// Return the computed matrix
    return obj;
};


/**
* @function axty
*
* @summary Returns the product of a matrix with a real number and with the
* transpose of another matrix.
*
* @description This function computes a*X*Y^t, the product of a n by m matrix X
* with a real number a and with the transpose of another p by m matrix Y.
*
* @param {number} a a real number.
* @param {Matrix_} X a n by m matrix.
* @param {Matrix_} Y a p by m matrix.
* @param {Matrix_} out an optional n by p matrix.
* @return {Matrix_} the matrix a*X*Y^t, either stored in the matrix out or in a new matrix, a n by p matrix.
*
* @example
* axty(Matrix_(1, [[1,2,3], [4,5,6]]), Matrix_([[1,2,3], [1,2,3]]));
* // Matrix_([[14,14], [32,32]])
*/
Matrix_.axty = function(a, X, Y, out) {
	// Ensure X, Y are matrices
	if (!(X instanceof Matrix_)) {
		throw new Error('second input must be a matrix');
	}
	if (!(Y instanceof Matrix_)) {
		throw new Error('third input must be a matrix');
	}
	
	// Checks
	if (X.nbColumns !== Y.nbColumns) {
		throw new Error('matrices sizes do not match: ' + '(' + X.nbRows + ',' + Y.nbColumns + 
		') - ' + '(' + Y.nbRows + ',' + Y.nbColumns + ')');
	}
	
	// Result matrix allocation
	var obj = allocateMatrix_(X.nbRows, Y.nbRows, out);

	// Computation of a*X*Y product in IJK format due to Y being used in
	// transposed form
    for (var i = 0; i < X.nbRows; ++i) {
        for (var j = 0; j < Y.nbRows; ++j) {
            obj.data[i * obj.nbColumns + j] = 0;
            
            for (var k = 0; k < X.nbColumns; ++k) {
                obj.data[i * obj.nbColumns + j] += X.data[i * X.nbColumns + k] * Y.data[j * Y.nbColumns + k];
            }
            
            obj.data[i * obj.nbColumns + j] = a * obj.data[i * obj.nbColumns + j];
        }
    }
	
	// Return the computed matrix
    return obj;
};


/**
* @function atxy
*
* @summary Returns the product of the transpose of a matrix with a real number 
* and with another matrix.
*
* @description This function computes a*X^t*Y, the product of the transpose of 
* a m by n matrix X with a real number a and with another m by p matrix Y.
*
* @param {number} a a real number.
* @param {Matrix_} X a m by n matrix.
* @param {Matrix_} Y a m by p matrix.
* @param {Matrix_} out an optional n by p matrix.
* @return {Matrix_} the matrix a*X^t*Y, either stored in the matrix out or in a new matrix, a n by p matrix.
*
* @example
* atxy(1, Matrix_([[1,4], [2,5], [3,6]]), Matrix_([[1,1], [2,2], [3,3]]));
* // Matrix_([[14,14], [32,32]])
*/
Matrix_.atxy = function(a, X, Y, out) {
	// Ensure X, Y are matrices
	if (!(X instanceof Matrix_)) {
		throw new Error('second input must be a matrix');
	}
	if (!(Y instanceof Matrix_)) {
		throw new Error('third input must be a matrix');
	}
	
	// Checks
	if (X.nbRows !== Y.nbRows) {
		throw new Error('matrices sizes do not match: ' + '(' + X.nbRows + ',' + Y.nbColumns + 
		') - ' + '(' + Y.nbRows + ',' + Y.nbColumns + ')');
	}

	// Result matrix allocation
	var obj = allocateMatrix_(X.nbColumns, Y.nbColumns, out);

	// Computation of a*X*Y product in KIJ format due to X being used in
	// transposed form
    // First k loop unrolled to initialize the matrix with zeros
	var k = 0;
	for (var i = 0; i < X.nbColumns; ++i) {
		var a_ik = a * X.data[k * X.nbColumns + i];
		
		for (var j = 0; j < Y.nbColumns; ++j) {
			obj.data[i * obj.nbColumns + j] = 0;
		}

		for (var j = 0; j < Y.nbColumns; ++j) {
			obj.data[i * obj.nbColumns + j] += a_ik * Y.data[k * Y.nbColumns + j];
		} 
	}
    for (var k = 1; k < X.nbRows; ++k) {
        for (var i = 0; i < X.nbColumns; ++i) {
            var a_ik = a * X.data[k * X.nbColumns + i];
			
            for (var j = 0; j < Y.nbColumns; ++j) {
                obj.data[i * obj.nbColumns + j] += a_ik * Y.data[k * Y.nbColumns + j];
            } 
        }
    }

	// Return the computed matrix
    return obj;
};

/**
* @function diagonal
*
* @summary Returns a diagonal matrix constructed from a vector.
*
* @description This function computes a diagonal square matrix (a_ij),i=1..n,j=1..n from 
* a vector vec of n elements, with coefficients a_ij satisfying a_ij = 0, i <> j and a_ij = vec_i1, i==j.
*
* @param {Matrix_} x a n by 1 matrix.
* @param {Matrix_} out an optional n by n matrix.
* @return {Matrix_} a n by n diagonal matrix with its diagonal elements corresponding to the elements of x,
* either stored in the matrix out or in a new matrix.
*
* @example
* diagonal(Matrix_([1,2,3]));
* // == Matrix_([[1,0,0], [0,2,0], [0,0,3]])
*/
Matrix_.diagonal = function(x, out) {
	// Checks
	if (!(x instanceof Matrix_) || !x.isVector()) {
		throw new Error('first input must be a vector');
	}

	// Result matrix allocation
	var n = x.nbRows;
	var obj = allocateMatrix_(n, n, out);
	
	// Result matrix computation
	for (var i = 0; i < n; ++i) {
		for (var j = 0; j < n; ++j) {
			obj.data[i * n + j] = 0;
		}
		obj.data[i * n + i] = x.data[i];
	}
	
	// Return the computed matrix
    return obj;
};


/**
* @function fillSymmetric
*
* @summary Returns a symmetric matrix constructed from a function.
*
* @description This function computes a square matrix (a_ij),i=1..n,j=1..n from a function, 
* with coefficients a_ij satisfying a_ij = a_ji = fct(i,j).
*
* The function fct is only called for indices i such that j >= i.
*
* @param {number} n, the order of the matrix to create, a strictly positive integer.
* @param {function(number, number): number} fct the function to call on each (i,j) pair of indexes with j >= i,
* which should take 2 arguments: row index i=1..n, column index j=i..n and which
* should return a number, which will be inserted into the matrix as its a_ij coefficient.
* @param {Matrix_} out an optional n by n matrix.
* @return {Matrix_} a n by n symmetric matrix with its elements computed by the function fct,
* either stored in the matrix out or in a new matrix..
*
* @example
* fillSymetric(2, function(i,j) { return 0; });
* // == Matrix_([[0,0], [0,0]])
*/
Matrix_.fillSymmetric = function(n, fct, out) {
	// Checks
	if (n < 1) {
		throw new Error('input number of rows and columns out of bounds: ' + n);
	}
	
	// Result matrix allocation
	var obj = allocateMatrix_(n, n, out);
	
	// Computation of the elements of the matrix
	for (var i = 0; i < n; ++i) {
		for (var j = 0; j < i; ++j) {
			obj.data[i * n + j] = obj.data[j * n + i];
		}
		for (var j = i; j < obj.nbColumns; ++j) {
			obj.data[i * n + j] = fct(i + 1, j + 1);
		}	
	}
	
	// Return the computed matrix
    return obj;
};


/**
* @function fill
*
* @summary Returns a matrix constructed from a function.
*
* @description This function computes a n by m matrix (a_ij),i=1..n,j=1..m from a function, 
* with coefficients a_ij satisfying a_ij = fct(i,j).
*
* @param {number} n the number of rows of the matrix to construct, natural integer greater than or equal to 1.
* @param {number} m the number of columns of the matrix to construct, natural integer greater than or equal to 1.
* @param {function(number, number): number} fct the function to call on each (i,j) pair of indexes,
* which should take 2 arguments: row index i=1..n, column index j=i..n and which
* should return a number, which will be inserted into the matrix as its a_ij coefficient.
* @param {Matrix_} out an optional n by m matrix.
* @return {Matrix_} a n by m matrix with its elements computed by the fonction fct,
* either stored in the matrix out or in a new matrix.
*
* @example
* fill(2, 2, function(i,j) { return 0; });
* // == Matrix_([[0,0], [0,0]])
*/
Matrix_.fill = function(n, m, fct, out) {
	// Checks
	if (n < 1) {
		throw new Error('input number of rows out of bounds: ' + n);
	}
	if (m < 1) {
		throw new Error('input number of columns out of bounds: ' + m);
	}
	
	// Result matrix allocation
	var obj = allocateMatrix_(n, m, out);
	
	// Computation of the elements of the matrix
	for (var i = 0; i < n; ++i) {
		for (var j = 0; j < m; ++j) {
			obj.data[i * m + j] = fct(i + 1 , j + 1);
		}
	}
	
	// Return the computed matrix
    return obj;
};



/**
* @function zeros
*
* @summary Returns a matrix made of zeros.
*
* @description This function builds an n by m matrix (a_ij),i=1..n,j=1..m satisfying a_ij = 0,i=1..n,j=1..m.
* 
* @param {number} n the row length of the matrix to construct, natural integer greater than or equal to 1.
* @param {number} m the column length of the matrix to construct, natural integer greater than or equal to 1.
* @param {Matrix_} out an optional n by m matrix.
* @return {Matrix_} the constructed matrix, either stored in the matrix out or in a new matrix.
*
* @example
* zeros(3, 2);
* // Matrix_([[0,0], [0,0], [0,0]])
*/
Matrix_.zeros = function(n, m, out) {
	// Result matrix allocation
	var obj = allocateMatrix_(n, m, out);
	
	// Result matrix computation
	var nbElements = n * m;
	for (var k = 0; k < nbElements; ++k) {
		obj.data[k] = 0;
	}
	
	// Return the computed matrix
    return obj;	

}


/**
* @function ones
*
* @summary Returns a matrix made of ones.
*
* @description This function builds an n by m matrix (a_ij),i=1..n,j=1..m satisfying a_ij = 1,i=1..n,j=1..m.
* 
* @param {number} n the row length of the matrix to construct, natural integer greater than or equal to 1.
* @param {number} m the column length of the matrix to construct, natural integer greater than or equal to 1.
* @return {Matrix_} the constructed matrix.
*
* @example
* ones(3, 2);
* // Matrix_([[1,1], [1,1], [1,1]])
*/
Matrix_.ones = function(n, m) {
	// Result matrix allocation
	var obj = allocateMatrix_(n, m);
	
	// Result matrix computation
	var nbElements = n * m;
	for (var k = 0; k < nbElements; ++k) {
		obj.data[k] = 1;
	}
	
	// Return the computed matrix
    return obj;
}


/**
* @function identity
*
* @summary Returns a matrix made of ones on the main diagonal and zeros elsewhere, i.e., an identity matrix.
*
* @description This function builds an n by n matrix (a_ij),i=1..n,j=1..n satisfying a_ii = 1, i=1..n and
* a_ij = 0, i=1..n,j=1..n,i<>j.
* 
* @param {number} n the row/column length of the matrix to construct, natural integer greater than or equal to 1.
* @return {Matrix_} the constructed matrix.
*
* @example
* identity(3);
* // Matrix_([[1,0,0], [0,1,0], [0,0,1]])
*/
Matrix_.identity = function(n) {
	// Result matrix allocation
	var obj = allocateMatrix_(n, n);
	
	// Result matrix computation
	var nbElements = n * n;
	for (var k = 0; k < nbElements; ++k) {
		obj.data[k] = 0;
		if (k % (n + 1) == 0) {
			obj.data[k] = 1;
		}
	}
	
	// Return the computed matrix
    return obj;
}

/**
* @function normrnd
*
* @summary Returns a matrix made of random numbers from the normal distribution.
*
* @description This function builds an n by m matrix (a_ij),i=1..n,j=1..m satisfying 
* a_ij is a random number from the normal distribution with mean parameter mu and 
* standard deviation parameter sigma.
* 
* @param {number} n the row length of the matrix to construct, natural integer greater than or equal to 1.
* @param {number} m the column length of the matrix to construct, natural integer greater than or equal to 1.
* @param {number} mu mean parameter of the  normal distribution, real number; defaults to 0.
* @param {number} sigma standard deviation parameter of the normal distribution, real number; defaults to 1.
* @return {Matrix_} the constructed matrix.
*
* @example
* normrnd(2, 2);
* // Matrix_([[0.5377,0.5377], [0.5377,0.5377]])
*/
Matrix_.normrnd = function(n, m, mu, sigma) {
	// Result matrix allocation
	var obj = allocateMatrix_(n, m);
	
	// Result matrix computation
	var nbElements = n * m;
	for (var k = 0; k < nbElements; ++k) {
		obj.data[k] = normrnd_(mu, sigma);
	}
	
	// Return the computed matrix
    return obj;
}


/**
* @function vectorHadamardProduct
*
* @summary Returns the Hadamard product of two vectors.
*
* @description This function computes the Hadamard product x*y of two vectors x and y of the same size.
* 
* @param {Matrix_} x a column matrix.
* @param {Matrix_} y a column matrix of same size as x.
* @return {Matrix_} the Hadamard product x*y.
*
* @example
* vectorHadamardProduct(Matrix_([1,2,3]), Matrix_([1,2,3]));
* // Matrix_([[1],[4],[9]])
*/
Matrix_.vectorHadamardProduct = function(x, y) {
	// Delegate the computations to the internal function.
	return Matrix_.elementwiseProduct(x, y);
}


/**
* @function vectorDotProduct
*
* @summary Returns the dot product of two column matrices (e.g. vectors).
*
* @description This function computes the dot product <x/y>, 
* where x and y are two n by 1 column matrices (e.g. vectors).
* 
* @param {Matrix_} x a n by 1 column matrix.
* @param {Matrix_} y a n by 1 column matrix.
* @return {number} the dot product <x/y>, a real number.
*
* @example
* vectorDotProduct(Matrix_([[1],[2],[3]]), Matrix_([[1],[2],[3]]));
* // 14
*/
Matrix_.vectorDotProduct = function(x, y) {
	// Ensure x,y are vectors
	if (!x.isVector()) {
		throw new Error('first argument must be a vector');
	}
	if (!y.isVector()) {
		throw new Error('second argument must be a vector');
	}

	// Checks
	if (x.nbRows !== y.nbRows) {
		throw new Error('Vectors sizes do not match: ' + '(' + x.nbRows + ') - ' + '(' + y.nbRows + ')');
	}
	
	// Computation of <x/y>
	var dotProd = 0;
	var nbElements = x.nbRows;
	for (var i = 0; i < nbElements; ++i) {
		dotProd += x.data[i] * y.data[i]; 
	}
	
	// Return it
	return dotProd;
}





/**
* @function qrDecomposition
*
* @summary Returns a QR decomposition of a matrix, using Givens rotations.
*
* @description This function computes a QR decomposition of an m by n matrix A with m >= n, 
* using Givens rotations as described in the algorithm 5.2.4 (and above discussion therein) of the first reference.
* 
* To be noted that the 'givens' internal function used in this function is not the same
* as the one described in the first reference, but is the continuous one described
* in the algorithm 4 of the second reference.
* 
* @see G.H. Golub and C.F. Van Loan, Matrix Computations, 4th Edition, Johns Hopkins Studies in the Mathematical Sciences
* @see <a href="http://www.netlib.org/lapack/lawnspdf/lawn150.pdf">Anderson, Edward (4 December 2000). Discontinuous Plane Rotations and the Symmetric Eigenvalue Problem. LAPACK Working Note. University of Tennessee at Knoxville and Oak Ridge National Laboratory.</a>
*
* @param {Matrix_} A an m by n matrix, with m >= n.
* @param {object} opt optional parameters for the algorithm.
* @param {boolean} opt.qLess boolean parameter to be set to true to discard the computation of the Q matrix; defaults to false.
* @return {<Array.<Matrix_>|Matrix_} either an R matrix if opt.qLess is set to true or an array of two matrices [Q, R] otherwise, 
* with Q and R satisfying the following properties:
* - Q is an orthogonal m by m matrix, with a determinant equals to 1 (i.e., a rotation)
* - R is an m by n upper triangular matrix, with its bottom (m−n) rows consisting entirely of zeroes
* - A = Q*R
*
* @example
* qrDecomposition(Matrix_([[2,3], [0,4]]));
* // [Matrix_([[1,0], [0,1]]), Matrix_([[2,3], [0,4]])]
*/
Matrix_.qrDecomposition = function(A, opt) {
	/**
    * @function givens
    *
    * @description Given real numbers a and b, this function computes c = cos(theta), s = sin(theta) and r >= 0 
    * satisfying [[c, s], [-s, c]]^T * [[a], [b]] = [[r], [0]].
    * 
    * C.f. the second reference for details.
    * 
    * @param {number} a, a real number
    * @param {number} b, a real number
    * @return {<Array.<number>} an array of three real numbers - c at array index 0, s at array index 1 and r at array index 2 -, satisfying the matrix equation above.
    */
	function givens(a, b) {
		var c;
		var s;
		var r;
		
		if (b == 0) {
			c = (a >= 0) ? 1 : -1; // emulates sign(a)
			s = 0;
			r = Math.abs(a);
		}
		else if (a == 0) {
			c = 0;
			s = ((b >= 0) ? 1 : -1); // emulates sign(b)
			r = Math.abs(b);
		}
		else if (Math.abs(a) > Math.abs(b)) {
			var t = b/a;
			var u = ((a >= 0) ? 1 : -1) * Math.sqrt(1 + t*t);
			c = 1/u;
			s = t*c;
			r = a*u;
		}
		else {
			var t = a/b;
			var u = ((b >= 0) ? 1 : -1) * Math.sqrt(1 + t*t);
			s = 1/u;
			c = t*s;
			r = b*u;
		}
		
		return [c, -s, r]; // Compared to the second reference, the sign of s is altered so that it is made compatible with the notations of the first reference.
	}

	// Decode options
	if (opt === undefined) {
		opt = {};
	}
	var isQLessDecomposition = opt.qLess || false;
	
	// Checks
	if (!(A instanceof Matrix_)) {
		throw new Error('first input must be a matrix');
	}
	if (A.nbRows < A.nbColumns) {
		throw new Error('matrix has more columns than rows: ' + '(' + A.nbRows + ') v.s. ' + '(' + A.nbColumns + ')');
	}

	// Initializations
	var m = A.nbRows;
	var n = A.nbColumns;

	// Create a copy of A so that it is not overwritten
	var R = new Matrix_(A); // represents R
	
	// Create the matrix that will hold Q
	var Q = null;
	if (!isQLessDecomposition) {
		Q = Matrix_.identity(m); // represents Q
	}
	
	// Core of the algorithm
	for (var j = 1; j <= n; ++j) {
		for (var i = m; i >= j+1; --i) {
			// This loop iteration will set R(i,j) to 0 using an appropriate Givens rotation
			
			// Builds G(i-1, i, theta)	
			var R_im_j_idx = (i-2) * R.nbColumns + (j-1);
			var R_i_j_idx = (i-1) * R.nbColumns + (j-1);
			
			var a = R.data[R_im_j_idx]; // R(i-1, j)
			var b = R.data[R_i_j_idx]; // R(i, j)
			var givensArr = givens(a, b);
			var c = givensArr[0];
			var s = givensArr[1];
			var r = givensArr[2];
			
			// Update R (left multiply R with the transpose of the Givens rotation, c.f. 5.1.9 of the first reference)		
				// Loop below unrolled for k = j, since R(i,j) must be made zero
			R.data[R_im_j_idx] = r; // R(i-1, j) = r
			R.data[R_i_j_idx] = 0; // R(i, j) = 0

				// Loop resumed at k = j+1
			for (var k = j+1; k <= n; ++k) {
				var R_im_k_idx = (i-2) * R.nbColumns + (k-1);
				var R_i_k_idx = (i-1) * R.nbColumns + (k-1);
			
				var t1 = R.data[R_im_k_idx]; // t1 = R(i-1, k)
				var t2 = R.data[R_i_k_idx]; // t2 = R(i, k)
				R.data[R_im_k_idx] = c*t1 - s*t2; // R(i-1, k) = ...
				R.data[R_i_k_idx] = s*t1 + c*t2; // R(i, k) = ...
			}
			
			// Update Q (right multiply Q with the Givens rotation, c.f. 5.1.9 of the first reference)
			if (!isQLessDecomposition) {
				for (var k = 1; k <= m; ++k) {
					var Q_k_im_idx = (k-1) * Q.nbColumns + (i-2);
					var Q_k_i_idx = (k-1) * Q.nbColumns + (i-1);
				
					var t1 = Q.data[Q_k_im_idx] // t1 = Q(k,i-1)
					var t2 = Q.data[Q_k_i_idx] // t2 = Q(k,i)
					Q.data[Q_k_im_idx] = c*t1 - s*t2; // Q(k,i-1) = ...
					Q.data[Q_k_i_idx] = s*t1 + c*t2; // Q(k,i) = ...
				}
			}
		}
	}
	
	// Return either the computed [Q, R] pair or the matrix R
	if (!isQLessDecomposition) {
		return [Q, R];
	}
	else {
		return R;
	}
}

/**
* @function svdDecomposition
*
* @summary Returns a singular value decomposition of a matrix, using a one-sided Jacobi algorithm.
*
* @description This function computes a singular value decomposition of an m by n matrix A with m >= n, 
* using the one-sided Jacobi algorithm described in the algorithm 4.1 of the first reference, 
* together with some computational improvements described in the second reference.
* 
* The computed decomposition can either be the thin or the full singular value decomposition,
* c.f. the third reference for the associated definitions.
*
* To be noted that a singular value decomposition of a rank-deficient matrix might not produce exact zero singular values 
* due to finite numerical precision.
* 
* @see <a href="https://doi.org/10.1137/0613074">James Demmel and Kresimir Veselic, Jacobi’s Method is More Accurate than QR, SIAM Journal on Matrix Analysis and Applications, 1992, Vol. 13, No. 4 : pp. 1204-1245</a>
* @see <a href="https://epubs.siam.org/doi/abs/10.1137/0910023">P. P. M. de Rijk, A One-Sided Jacobi Algorithm for Computing the Singular Value Decomposition on a Vector Computer, SIAM Journal on Scientific and Statistical Computing, 1989, Vol. 10, No. 2 : pp. 359-371</a>
* @see G.H. Golub and C.F. Van Loan, Matrix Computations, 4th Edition, Johns Hopkins Studies in the Mathematical Sciences
*
* @param {Matrix_} A an m by n matrix, with m >= n.
* @param {object} opt optional parameters for the algorithm.
* @param {number} opt.eps tolerance for the convergence of the algorithm, a strictly positive real number; defaults to 1e-16.
* @param {number} opt.maxIter maximum number of iterations of the algorithm, a strictly positive natural integer or -1 to force an infinite number of iterations; defaults to 100.
* @param {string} opt.svdForm string either equal to 'full' to compute the full singular value decomposition of the matrix A, or equal to 'thin' to compute
* the thin singular value decomposition of the matrix A; defaults to 'thin'.
* @return {<Array.<Matrix_>} an array of three matrices [U, S, V], with U, S and V satisfying the following properties:
* - If opt.svdForm is equal to 'thin':
* -- U is an m by n orthogonal matrix
* -- S is an n by n diagonal matrix, with its diagonal elements S_ii, i=1..n satisfying S_11 >= ... >= S_nn >= 0 
* - If opt.svdForm is equal to 'full':
* -- U is an m by m orthogonal matrix
* -- S is an m by n matrix, with its elements S_ii, i=1..n satisfying S_11 >= ... >= S_nn >= 0 and S_ij = 0, i=1..m, j=1..n, j <> i
* - In all cases:
* - V is an n by n orthogonal matrix 
* - A = U*S*V^t
*
* @example
* svdDecomposition(Matrix_([[1,0], [0,1]]));
* // [Matrix_([[1,0], [0,1]]), Matrix_([[1,0], [0,1]]), Matrix_([[1,0], [0,1]])]
*/
Matrix_.svdDecomposition = function(A, opt) {
	// ------
	
	// Decode options
	if (opt === undefined) {
		opt = {};
	}
	var eps = opt.eps || 1e-16;
	var maxIterations = opt.maxIter || 100;
	var svdForm = opt.svdForm || 'thin';
	
	
	// ------
	
	// Checks
	if (!(A instanceof Matrix_)) {
		throw new Error('first input must be a matrix');
	}
	if (A.nbRows < A.nbColumns) {
		throw new Error('matrix has more columns than rows: ' + A.nbColumns + ' v.s. ' + A.nbRows);
	}
	
	
	// ------
	
	// Initializations
	var m = A.nbRows;
	var n = A.nbColumns;
	
	// Create a copy of A so that it is not overwritten
	var uu = new Matrix_(A); // represents U 
	var u_frob_norm = uu.matrixNorm('frobenius');
	
	// Create the matrix that will hold V
	var vv = Matrix_.identity(n); // represents V
	
	
	// ------
	
	// Core of the algorithm, guaranteed to converge per theorem 4.9 of the first reference
	var iter = 0;
	var u_columns_two_norm_sq = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n);
	while (true) {
		// Update the number of iterations
		++iter;

		// Check the number of iterations (number of sweeps)
		if (maxIterations !== -1 && iter > maxIterations) {
			throw new Error('maximum number of iterations reached: ' + maxIterations);
		}
		
		// Compute/update the squares of the euclidean norms of the columns
		// of U in order to avoid the accumulation of numerical 
		// round-off errors in the Jacobi sweeps
		//
		// To be noted that as the Frobenius norm of U is not
		// altered by Jacobi rotations, no update of this norm is necessary
    	for (var j = 1; j <= n; ++j) {
    		var u_j_two_norm = uu.vectorNorm('two', 'column', j);
			u_columns_two_norm_sq[j-1] = u_j_two_norm * u_j_two_norm;
    	}
		
		// For all pairs (i, j) with i < j, proceed with one Jacobi sweep,
		// that is, n*(n-1)/2 Jacobi rotations
		var converged = true; // the convergence status is updated during the sweep
		for (var j = 2; j <= n; ++j) {
			for (var i = 1; i <= j-1; ++i) {
				// Compute the (i, j) 2x2 submatrix [[aa, cc], [cc, bb]] of U^t*U
				var aa = u_columns_two_norm_sq[i-1]; // aa = sum U(k,i)^2, k=1..m = ||U(:,i)||_2^2
				var bb = u_columns_two_norm_sq[j-1]; // bb = sum U(k,j)^2, k=1..m = ||U(:,j)||_2^2
				var cc = 0; // cc = sum U(k,i)*U(k,j), k=1..m = <U(:,i)/U(:.j)>
			    for (var k = 1; k <= m; ++k) {
					cc += uu.data[(k-1) * uu.nbColumns + (i-1)] * uu.data[(k-1) * uu.nbColumns + (j-1)]; 
				}

				// Test on convergence conditions before applying a Jacobi rotation
				// on columns i and j of U, c.f. formula 4.2.1 of the second reference:
				// - |<U(:,i)/U(:.j)>| > Math.sqrt(m) * eps * ||U(:,i)||_2 * ||U(:.j)||_2
				// - ||U(:,i)||_2 > eps * ||U||_f
				// - ||U(:,j)||_2 > eps * ||U||_f
				if (Math.abs(cc) <= eps * Math.sqrt(m * aa * bb)) { // this condition also covers the case cc = 0, which would make zeta below indefinite
					continue;
				}
				if (Math.sqrt(aa) <= eps * u_frob_norm || Math.sqrt(bb) <= eps * u_frob_norm) {
				    continue;
				}
				
				// The convergence conditions are not satisfied yet, so, a Jacobi
				// rotation is needed
				converged = false;
				
				// Compute the Jacobi rotation which diagonalizes the 
				// 2x2 submatrix [[aa, cc], [cc, bb]]
				var zeta = (aa - bb)/(2 * cc);
				var t = ((zeta >= 0) ? 1 : -1) / (Math.abs(zeta) + Math.sqrt(1 + zeta * zeta)); // first part emulates sign(zeta)
				var cs = 1 / Math.sqrt(1 + t*t);
				var sn = cs * t;

				// Update columns i and j of U (right multiply U with the Jacobi rotation)
				for (var k = 1; k <= m; ++k) {
					var t1 = uu.data[(k-1) * uu.nbColumns + (i-1)] // t1 = U(k,i)
					var t2 = uu.data[(k-1) * uu.nbColumns + (j-1)] // t2 = U(k,j)
					uu.data[(k-1) * uu.nbColumns + (i-1)] = cs*t1 + sn*t2 // U(k,i) = ...
					uu.data[(k-1) * uu.nbColumns + (j-1)] = -sn*t1 + cs*t2 // U(k,j) = ...
				}
				
				// Update the squares of the euclidean norms of columns i and j of U,
                // c.f. formula 2.2.10 of the second reference
                //
                // To be noted that this update creates numerical round-off errors, mitigated
                // by the full recomputation of these norms at the beginning of each Jacobi sweep
                //
                // To also be noted that as the Frobenius norm of U is not altered
                // by the Jacobi rotations, no update of this norm is necessary
                u_columns_two_norm_sq[i-1] += t * cc;
                u_columns_two_norm_sq[j-1] -= t * cc;

                // Update columns i and j of V (right multiply V with the Jacobi rotation)
				for (var k = 1; k <= n; ++k) {
					var t1 = vv.data[(k-1) * vv.nbColumns + (i-1)] // t1 = V(k,i)
					var t2 = vv.data[(k-1) * vv.nbColumns + (j-1)] // t2 = V(k,j)
					vv.data[(k-1) * vv.nbColumns + (i-1)] = cs*t1 + sn*t2 // V(k,i) = ...
					vv.data[(k-1) * vv.nbColumns + (j-1)] = -sn*t1 + cs*t2 // V(k,j) = ...
                }
            }
		}
		
		// In case the convergence status is true at the end of the sweep, 
		// the algorithm can be stopped
		if (converged == true) {
			break;
		}
	}

	
	// ------
	
	// At this stage:
	// - U is a rectangular m by n matrix with its non null columns made of orthogonal vectors
	// - V is an orthogonal square n by n matrix
	// - The right singular vectors are the columns of V
	// - The singular values are the norms of the columns of U
	// - The left singular vectors are the normalized columns of U
	//
	// Additional work is needed in order to achieve the thin singular value decomposition of A with:
    // - A = U*S*V^t
	// - U is an orthogonal rectangular m by n matrix
	// - S a diagonal n by n matrix with the n singular values of A on its diagonal 
	//   verifying S(i,i) = sigma_i and sigma_1 >= ... >= sigma_n >= 0
	// - V is an orthogonal square n by n matrix
	
	// Compute and sort the singular values of A in descending order 
	// together with their V matrix column indexes
	var sigmas = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n);
	var sigmas_idx = typeof Uint32Array === 'function' ? new Uint32Array(n) : new Array(n);
	for (var j = 1; j <= n; ++j) {
		// Compute sigma_j
		var singVal_j = Math.sqrt(u_columns_two_norm_sq[j-1]); // == uu.vectorNorm('two', 'column', j);
		sigmas[j-1] = singVal_j; 
		
		// At this stage, "numerically zero" singular values could be replaced
		// with 0, if needed.
		sigmas_idx[j-1] = j;
	}
	sigmas_idx.sort(function(a, b) { return sigmas[b-1] - sigmas[a-1]; });
	
	// Compute the thin U,S and V matrices
	var uuu = Matrix_.zeros(m, n); 
	var sss = Matrix_.zeros(n, n);
	var vvv = Matrix_.zeros(n, n);
	for (var j = 1; j <= n; ++j) {
		// Extract singular values information
		var sigma_j_col_idx = sigmas_idx[j-1];
		var sigma_j = sigmas[sigma_j_col_idx-1];

		// Thin S(j,j) must be equal to sigma_j
		sss.data[(j-1) * sss.nbColumns + (j-1)] = sigma_j;
		
		// Thin U(:,j) must be equal to the normalized column of the intermediate U
		// corresponding to sigma_j
		if (sigma_j != 0) { 
			for (var i = 1; i <= m; ++i) {
				uuu.data[(i-1) * uuu.nbColumns + (j-1)] = uu.data[(i-1) * uu.nbColumns + (sigma_j_col_idx-1)] / sigma_j;
			}
		}
		
		// Thin V(:,j) must be equal to the column of the intermediate V corresponding to sigma_j
		for (var i = 1; i <= n; ++i) {
			vvv.data[(i-1) * vvv.nbColumns + (j-1)] = vv.data[(i-1) * vv.nbColumns + (sigma_j_col_idx-1)];
		}		
	}
		
	// If the thin SVD decomposition of A is requested, return the 
	// computed U,S,V triple
	if (svdForm == 'thin') {
		return [uuu, sss, vvv];
	}
	
	// ------
	
	// Additional work is needed in order to achieve the full singular value decomposition of A with:
    // - A = U*S*V^t
	// - U is an orthogonal square m by m matrix
	// - S a rectangular m by n matrix with the n singular values of A on its diagonal 
	//   verifying S(i,i) = sigma_i and sigma_1 >= ... >= sigma_n >= 0
	// - V is an orthogonal square n by n matrix
	
	// Full U computation is made through a QR decomposition of thin U and completing the missing
	// columns of thin U by those of Q
	//
	// Full S computation is made by extending the thin S with zeroes
	var qr = Matrix_.qrDecomposition(uuu);
	var q = qr[0];
	
	var uuuu = Matrix_.zeros(m, m);
	var ssss = Matrix_.zeros(m, n);
	for (var j = 1; j <= n; ++j) {
		// Extract singular values information
		var sigma_j_col_idx = sigmas_idx[j-1];
		var sigma_j = sigmas[sigma_j_col_idx-1];
		
		// Full S(j,j) must be equal to sigma_j
		ssss.data[(j-1) * ssss.nbColumns + (j-1)] = sigma_j;
		
		// Full U(:,j) must be equal to the thin U(:,j) if the associated
		// singular value sigma_j is not null, and otherwise to Q(:,j)
		if (sigma_j != 0) {
			for (var i = 1; i <= m; ++i) {
				uuuu.data[(i-1) * uuuu.nbColumns + (j-1)] = uuu.data[(i-1) * uuu.nbColumns + (j-1)];
			}
		}
		else {
			for (var i = 1; i <= m; ++i) {
				uuuu.data[(i-1) * uuuu.nbColumns + (j-1)] = q.data[(i-1) * q.nbColumns + (j-1)];
			}
		}
	}
	for (var j = n+1; j <= m; ++j) {
		// Full U(:,j) must be equal to Q(:,j)
		for (var i = 1; i <= m; ++i) {
			uuuu.data[(i-1) * uuuu.nbColumns + (j-1)] = q.data[(i-1) * q.nbColumns + (j-1)];
		}
	}
	
	// If the full SVD decomposition of A is requested, return the 
	// computed U,S,V triple
	if (svdForm == 'full') {
		return [uuuu, ssss, vvv];
	}
}


/**
* @function nullSpace
*
* @summary Returns an orthonormal basis of the null space of a matrix.
*
* @description This function computes an orthonormal basis of the null space of an m by n matrix A, 
* obtained from a singular value decomposition of this matrix.
* 
* As a singular value decomposition of a rank-deficient matrix might not produce exact zero singular values
* due to finite numerical precision, the dimension of the null space of the matrix A is numerically defined as
* the number of singular values strictly lower than an optional tolerance eps.
*
* To be noted that in case the matrix A is of full-rank, a zero vector is returned.
* 
* @see G.H. Golub and C.F. Van Loan, Matrix Computations, 4th Edition, Johns Hopkins Studies in the Mathematical Sciences
*
* @param {Matrix_} A an m by n matrix.
* @param {object} opt optional parameters for the algorithm.
* @param {number} opt.eps numerical tolerance under which a singular value is considered as zero, a strictly positive real number; defaults to max(m,n) * eps(s_1), where eps(s_1) is the distance from the greatest singular value s_1 of A to the next larger floating-point number.
* @return {Matrix_} either an m by 1 matrix made of zeroes in case the matrix A is of full-rank, or an m by p orthogonal matrix
* where p is equal to the numerical dimension of the null space of the matrix A.
*
* @example
* nullSpace(Matrix_([[2,1],[-4,-2]]));
* // Matrix_([-0.4472135954999578, 0.8944271909999159])
*/
Matrix_.nullSpace = function(A, opt) {	
    // ------
   
    // Decode options
    if (opt === undefined) {
        opt = {};
    }
    var eps = opt.eps || undefined;

   
    // ------
   
    // Misc. checks
    if (!(A instanceof Matrix_)) {
        throw new Error('first input must be a matrix');
    }   


    // ------
   
    // Initializations
    var m = A.nbRows;
    var n = A.nbColumns;
    var a_ns = null;
   
    // ------

    // Depending on the shape of the matrix A, a different algorithm is used:
    // - m >= n: an orthogonal basis of Ker(A) is directly read from a thin SVD
    // decomposition of the matrix A, c.f. corollary 2.4.6 of the reference
    //
    // - m < n: an orthogonal basis of Ker(A) is obtained by computing the orthogonal
    // complement of an orthogonal basis of Range(A^t), this orthogonal basis being directly
    // read from a thin SVD decomposition of A^t, c.f. corollary 2.4.6 of the reference
    //
    // The underlying properties which justifies this approach is that
    // R^m = Range(A^t) _|_ Ker(A) for any m by n real matrix A
    if (m >= n) {
        // Compute a thin SVD decomposition of A: A = U*S*V^t
		var svd = Matrix_.svdDecomposition(A, {maxIter: -1});		
        var u = svd[0];
        var s = svd[1];
        var v = svd[2];
       
		// Compute the default tolerance, if required
		if (eps === undefined) {
			eps = m * (nextUp_(s.data[0]) - s.data[0]);
		}
	   
        // Determine the numerical rank of A
        var r;
        for (r = n; r >= 1; --r) {
            // Comparison of the r-th greatest singular value of A with the tolerance parameter to determine
            // the first "zero" singular value of A
            if (s.data[(r-1)*s.nbColumns + (r-1)] > eps) {
                break;
            }
        }
        var p = r;
       
        // If the matrix A is of full rank n, its null space is reduced to the zero vector
        //
        // Otherwise, extract from the matrix V the n-p right singular vectors associated to the
        // n-p zero singular values, which then form an orthogonal basis of Ker(A)
        if (p == n) {
            a_ns = Matrix_.zeros(n, 1);
        }
        else {
            // Extract from V an orthogonal basis of Ker(A) of dimension n-p
            a_ns = new Matrix_.zeros(n, n - p);
            for (var j = p + 1; j <= n; ++j) {
                for (var i = 1; i <= n; ++i) {
                    a_ns.data[(i-1)*a_ns.nbColumns + ((j-(p+1)+1)-1)] = v.data[(i-1)*v.nbColumns + (j-1)];
                }
            }
        }       
    }
    else {
        // Compute a thin SVD decomposition of A^t: A^t = U*S*V^t
        var svd = Matrix_.svdDecomposition(A.transpose(), {maxIter: -1, svdForm: 'full'});
        var u = svd[0];
        var s = svd[1];
        var v = svd[2];
       
		// Compute the default tolerance, if required
		if (eps === undefined) {
			eps = n * (nextUp_(s.data[0]) - s.data[0]);
		}
	   
        // Determine the numerical rank of A^t
        var r;
        for (r = m; r >= 1; --r) {
            // Comparison of the r-th greatest singular value of A^t with the tolerance parameter to determine
            // the first "zero" singular value of A^t
            if (s.data[(r-1)*s.nbColumns + (r-1)] > eps) {
                break;
            }
        }
        var p = r;
       
        // If the matrix A^t is of full rank, the null space of the matrix A
        // is reduced to the zero vector
        //
        // Otherwise:
        // - Extract from the matrix U the p left singular vectors associated to the
        // p non zero singular values, which then form an orthogonal basis of Range(A^t)
        //
        // - Compute the orthogonal complement of this orthogonal basis, which then
        // form an orthogonal basis of Ker(A)
        if (p == m) {
            a_ns = Matrix_.zeros(n, 1);
        }
        else {
            // Extract from U an orthogonal basis of Range(A^t) of dimension p,
            // with n > m > p
            var ta_rg = new Matrix_.zeros(n, p);
            for (var j = 1; j <= p; ++j) {
                for (var i = 1; i <= n; ++i) {
                    ta_rg.data[(i-1)*ta_rg.nbColumns + (j-1)] = u.data[(i-1)*u.nbColumns + (j-1)];
                }
            }
           
            // Compute the orthogonal complement, of dimension n-p,
            // of the above orthogonal basis
            var qr = Matrix_.qrDecomposition(ta_rg);
            var q = qr[0];
           
            // The orthogonal complement above (the last n-p column vectors of the matrix Q)
            // is then an orthogonal basis of Ker(A)
            var a_ns = new Matrix_.zeros(n, n-p);
            for (var j = p+1; j <= n; ++j) {
                for (var i = 1; i <= n; ++i) {
                    a_ns.data[(i-1)*a_ns.nbColumns + ((j-(p+1)+1)-1)] = q.data[(i-1)*q.nbColumns + (j-1)];
                }
            }           
        }
    }
   
    // Return the computed null space basis
    return a_ns;
}


/**
* @function linsolveBackwardSubstitution
*
* @summary Returns the solution of an upper triangular square system of linear equations.
*
* @description This function computes the solution of an upper triangular square system of linear equations Ax = b,
* as described in the algorithm 3.1.2 of the reference.
* 
* To be noted that the system of linear equations must be solvable (i.e., no zero elements must be present on the matrix A diagonal).
*
* @see G.H. Golub and C.F. Van Loan, Matrix Computations, 4th Edition, Johns Hopkins Studies in the Mathematical Sciences
*
* @param {Matrix_} A a n by n matrix.
* @param {Matrix_} b a n by 1 matrix.
* @return {<Matrix_} an n by 1 matrix x^* satisfying Ax^* = b.
*
* @example
* linsolveBackSubstitution(Matrix_([[1,2], [0,1]]), Matrix_([3,1]));
* // Matrix_([1,1])
*/
Matrix_.linsolveBackSubstitution = function(A, b, out) {
	// ------
	
	// Misc. checks
	if (!(A instanceof Matrix_)) {
		throw new Error('first input must be a matrix');
	}
	if (!(b instanceof Matrix_)) {
		throw new Error('second input must be a matrix');
	}
	
	if (!A.isSquare()) {
		throw new Error('matrix is not square: ' + '(' + A.nbRows + ',' + A.nbColumns + ')');
	}
	if (A.nbRows !== b.nbRows) {
		throw new Error('matrix and second member sizes do not match: ' + '(' + A.nbRows + ',' + A.nbColumns + 
		') - ' + '(' + b.nbRows + ',' + b.nbColumns + ')');
	}
	if (b.nbColumns !== 1) {
		throw new Error('b is not a vector: ' + '(' + b.nbRows + ',' + b.nbColumns + ')');
	}

	// ------
	
	// Initializations
	var n = A.nbColumns;

	// Result matrix allocation
	var x = allocateMatrix_(n, 1, out); // the solution vector

	// ------
	
	// Compute the solution to Ax = b, with a a square invertible upper triangular matrix,
	// using the row-oriented back substitution algorithm described in section 3.1.2 of the reference.
	for (var i = n; i >= 1; --i) {
		x.data[i-1] = b.data[i-1];
		for (var j = i + 1; j <= n; ++j) {
			x.data[i-1] = x.data[i-1] - A.data[(i-1) * A.nbColumns + (j-1)] * x.data[j-1];
		}
		var a_ii = A.data[(i-1) * A.nbColumns + (i-1)];
		if (a_ii == 0) {
			throw new Error('input matrix is not invertible: zero diagonal coefficient at index ' + i);
		}
		else {
			x.data[i-1] = x.data[i-1] / a_ii;
		}
	}

	// Return the computed solution
	return x;
}



/**
* @function randomOrthogonal
*
* @summary Returns a random orthogonal matrix.
*
* @description This function computes a random orthogonal n by n matrix from 
* the Haar distribution, using the O(n^3) algorithm described in the references.
* 
* @see <a href="https://www.tandfonline.com/doi/abs/10.1080/00207169508804364">Francesco Mezzadri, How to Generate Random Matrices from the Classical Compact Groups, Notices of the AMS, Volume 54, Number 5</a>
* @see <a href="http://home.lu.lv/~sd20008/papers/essays/Random%20unitary%20[paper].pdf">Maris Ozols. How to generate a random unitary matrix, 2009.</a>
*
* @param {number} n the row/column length of the matrix to construct, natural integer greater than or equal to 1.
* @return {Matrix_} the constructed matrix.
*
*/
Matrix_.randomOrthogonal = function(n) {
	// 1 - Generate an n by n matrix whose entries are standard normal random variables
	var z = Matrix_.normrnd(n, n); // Unlike the first reference, and like the second reference, no division by SQRT(2) is made
	
	// 2 - Feed Z into any QR decomposition routine, and
	// let (Q,R), where Z = QR, be the output
	var qr = Matrix_.qrDecomposition(z);
	var q = qr[0];
	var r = qr[1];
	
	// 3 - Create the diagonal matrix Lambda with Lambda_ii = r_ii/|r_ii|,
	// c.f. formula 38 of the reference.
	var lambda = Matrix_.fill(1, n, function(i,j) { return r.data[(j-1) * r.nbColumns + (j-1)] >= 0 ? 1 : -1; });

	// 4 - The matrix Q*Lambda is distributed with Haar measure.
	return Matrix_.elementwiseProduct(q, lambda);
}


/**
* @function randomCorrelation
*
* @summary Returns a random correlation matrix.
*
* @description This function computes a random n by n correlation matrix, 
* using the O(n^3) algorithm described in the reference.
* 
* @see <a href="https://link.springer.com/article/10.1023/A:1022384216930">Philip I. Davies and Nicholas J. Higham, Numerically Stable Generation of Correlation Matrices and Their Factors,BIT Numerical Mathematics volume 40, pages 640–651 (2000)</a>
*
* @param {number} n the row/column length of the matrix to construct, natural integer greater than or equal to 1.
* @param {object} opt optional parameters for the algorithm.
* @param {number} opt.eps tolerance for the convergence of the algorithm, a strictly positive real number; defaults to 1e-14.
* @param {Array.<number>} opt.lambda the desired eigenvalues lambda_i, i=1..n of the generated correlation matrix, an array of n real numbers lambda_i,
* which must satisfy 0 <= lambda_i, i = 1..n and sum_i lambda_i = n; defaults to an array of random numbers belonging to [0,1] and summing to one.
* @param {number} opt.epsLambda tolerance for the condition that the provided eigenvalues must sum to one; defaults to 1e-8.
* @return {Matrix_} the constructed matrix.
*
*/
Matrix_.randomCorrelation = function(n, opt) {
	// Initialize the options structure
	if (opt === undefined) {
		opt = { };
	}
	
	// Initialize the options default values
	if (opt.eps === undefined) {
		opt.eps = 1e-14;
	}
	if (opt.epsLambda === undefined) {
		opt.epsLambda = 1e-8;
	}
	if (opt.lambda === undefined) {
		opt.lambda = new simplexRandomSampler_(n).sample();
		for (var i = 0; i < n; ++i) {
			opt.lambda[i] *= n;
		}
	}

	// Check if the number of provided eigenvalues is correct
	if (opt.lambda.length != n) {
		throw new Error('number of input eigenvalues not equal to ' + n + ', but to ' + opt.lambda.length);
	}
	
	// Check if the provided eigenvalues sum to n
	var sum_lambda = 0;
	for (var i = 0; i < n; ++i) {
		sum_lambda += opt.lambda[i];
	}
	if (Math.abs(sum_lambda - n) > opt.epsLambda) {
		throw new Error('input eigenvalues not summing to ' + n);
	}

	// Decode the options
	var eps = opt.eps;
	var lambda = Matrix_.fill(1, n, function(i,j) { return opt.lambda[j-1]; });
	

	// 1 - Form a random orthogonal matrix U from the Haar distribution
	var u = Matrix_.randomOrthogonal(n);
	
	// 2 - Let A = U diag(lambda) U^t
	var a = Matrix_.axty(1, Matrix_.elementwiseProduct(u, lambda), u);
	
	// 3 - While some a_ii <> 1, apply a Givens rotation to set a_ii = 1
	// 
	// This step takes at most n-1 iterations, this is important to enforce
	// to avoid numerical issues.
	for (var k = 1; k < n; ++k) {
		// Check if all the elements of the diagonal of the matrix a
		// are numerically equal to 1, in which case the algorithm
		// has converged.
		//
		// At the same time, force the non-numerically equal to 1 elements
		// to 1, as the algorithm below guarantees this.
		var converged = true;
		for (var l = 1; l <= n; ++l) {
			var a_ll = a.data[(l-1) * a.nbColumns + (l-1)];
			
			if (Math.abs(a_ll - 1) > eps) {
				converged = false;
				break;
			}
			else {
				if (a_ll != 1) {
					a.data[(l-1) * a.nbColumns + (l-1)] = 1;
				}
			}
		}
		if (converged) {
			break;
		}

		
		// Find indices i and j with i < j so that a_ii < 1 < a_jj or a_ii > 1 > a_jj
		
		// Tentative a_ii < 1 < a_jj
		var i = -1; // first index for which a_ii < 1
		var j = -1; // last index for which a_jj >1
		for (var l = 1; l <= n; ++l) {
			if (a.data[(l-1) * a.nbColumns + (l-1)] < 1 && i === -1) {
				i = l;
			}
			if (a.data[(l-1) * a.nbColumns + (l-1)] > 1) {
				j = l;
			}
		}
		
		// Tentative above failed, new tentative with a_ii > 1 > a_jj
		if (i > j) {
			i = -1; // first index for which a_ii > 1
			j = -1; // last index for which a_jj < 1
			for (var l = 1; l <= n; ++l) {
				if (a.data[(l-1) * a.nbColumns + (l-1)] > 1 && i === -1) {
					i = l;
				}
				if (a.data[(l-1) * a.nbColumns + (l-1)] < 1) {
					j = l;
				}
			}
		}
		
		
		// Apply a Givens rotation in the (i, j) plane to set a_ii = 1
		
		//
		var a_ii = a.data[(i-1) * a.nbColumns + (i-1)];
		var a_ij = a.data[(i-1) * a.nbColumns + (j-1)];
		var a_jj = a.data[(j-1) * a.nbColumns + (j-1)];
		
		//
		var t = (a_ij + Math.sqrt(a_ij*a_ij - (a_ii-1)*(a_jj-1) )) / (a_jj - 1);
		var c = 1/Math.sqrt(1 + t*t);
		var s = c*t;
		
		// a_old = a
		// Update a(i,:) = c*a_old(i,:) - s*a_old(j,:);
		// Update a(j,:) = s*a_old(i,:) + c*a_old(j,:);
		for (var l = 1; l <= n; ++l) {
			var t1 = a.data[(i-1) * a.nbColumns + (l-1)]; // a(i,l)
			var t2 = a.data[(j-1) * a.nbColumns + (l-1)]; // a(j,l)
			
			a.data[(i-1) * a.nbColumns + (l-1)] = c*t1 - s*t2;
			a.data[(j-1) * a.nbColumns + (l-1)] = s*t1 + c*t2;
		}
		
		// a_old = a
		// Update a(:,i) = c*a_old(:,i) - s*a_old(:,j);
		// Update a(:,j) = s*a_old(:,i) + c*a_old(:,j);
		for (var l = 1; l <= n; ++l) {
			var t1 = a.data[(l-1) * a.nbColumns + (i-1)]; // a(l,i)
			var t2 = a.data[(l-1) * a.nbColumns + (j-1)]; // a(l,j)
			
			a.data[(l-1) * a.nbColumns + (i-1)] = c*t1 - s*t2;
			a.data[(l-1) * a.nbColumns + (j-1)] = s*t1 + c*t2;
		}
		
		
		// In order to avoid numerical issue, explicitly set a_ii to 1
		a.data[(i-1) * a.nbColumns + (i-1)] = 1;
	}

	// 3, bis - Polish the diagonal elements of the matrix a
	for (var l = 1; l <= n; ++l) {
		a.data[(l-1) * a.nbColumns + (l-1)] = 1;
	}
	
	// 4 - Return the computed matrix
	return a;
}


/**
* @function linsolveExtendedKaczmarz
*
* @summary Returns the solution of a system of linear equations, using the extended Kaczmarz method.
*
* @description This function computes the solution of a system of linear equations Ax = b, using the 
* extended Kaczmarz iterative method in either its deterministic form (c.f. the first reference) 
* or its randomized form (c.f. the second reference).
* 
* To be noted that the extended Kaczmarz method allows to compute the solution of a system of 
* linear equations Ax = b even if this system is not solvable; in this case, the computed solution is
* the solution of minimum euclidian norm of the linear least squares problem argmin_x ||Ax - b||_2.
*
* @see <a href="https://www.tandfonline.com/doi/abs/10.1080/00207169508804364">Popa, Constantin. (1995). Least-squares solution of overdetermined inconsistent linear systems using Kaczmarz's relaxation. International Journal of Computer Mathematics. 55. 79-89.</a>
* @see <a href="https://epubs.siam.org/doi/abs/10.1137/120889897">Anastasios Zouzias and Nikolaos M. Freris, Randomized Extended Kaczmarz for Solving Least Squares, SIAM Journal on Matrix Analysis and Applications, 2013, Vol. 34, No. 2 : pp. 773-793</a>
*
* @param {Matrix_} A a m by n matrix.
* @param {Matrix_} b a m by 1 matrix.
* @param {object} opt optional parameters for the algorithm.
* @param {number} opt.eps tolerance for the convergence of the algorithm, a strictly positive real number; defaults to 1e-12.
* @param {number} opt.maxIter maximum number of iterations of the algorithm, a strictly positive natural integer or -1 to force an infinite number of iterations; defaults to 100000.
* @param {boolean} opt.randomized whether to use the deterministic extended Kaczmarz method (true) or the randomized extended Kaczmarz method (false); defaults to false.
* @return {<Matrix_} an n by 1 matrix x^* satisfying the following properties:
* - If the linear system of equations Ax = b is square with A invertible, then x^* is the unique solution of this system
* - If the linear system of equations Ax = b is not square (i.e., overdetermined or underdetermined) or is square with A non invertible, then x^* is the minimum euclidian norm solution
* of the linear least squares problem argmin_x ||Ax - b||_2
*
* @example
* linsolveExtendedKaczmarz(Matrix_([[3,2,-1], [2,-2,4], [-1, 0.5, -1]]), Matrix_([1,-2,0]));
* // Matrix_([1, -2, -2])
*/
Matrix_.linsolveExtendedKaczmarz = function(A, b, opt) {
	// ------
	
	// Decode options
	if (opt === undefined) {
		opt = {};
	}
	var eps = opt.eps || 1e-12;
	var maxIterations = opt.maxIter || 100000;
	var randomized = false;
	if (opt.randomized !== undefined) {
		randomized = opt.randomized;
	}
	
	
	// ------
	
	// Misc. checks
	if (!(A instanceof Matrix_)) {
		throw new Error('first input must be a matrix');
	}
	if (!(b instanceof Matrix_)) {
		throw new Error('second input must be a matrix');
	}
	
	if (A.nbRows !== b.nbRows) {
		throw new Error('matrix and second member sizes do not match: ' + '(' + A.nbRows + ',' + A.nbColumns + 
		') - ' + '(' + b.nbRows + ',' + b.nbColumns + ')');
	}
	if (b.nbColumns !== 1) {
		throw new Error('b is not a vector: ' + '(' + b.nbRows + ',' + b.nbColumns + ')');
	}


	// ------
	
	// Initializations
	var m = A.nbRows;
	var n = A.nbColumns;
	var x_k = Matrix_.zeros(n, 1); // the current solution
	var z_k = Matrix_.copy(b); // the current "adjusted" b
	
	var x_res = Matrix_.zeros(m, 1); // the x residuals vector
	var b_res = Matrix_.zeros(m, 1); // the b residuals vector
	var a_x_k = Matrix_.zeros(m, 1); // A*x_k

	// Preliminary computation of the Frobenius norm of A
	var a_frob_norm = A.matrixNorm('frobenius');
	var a_frob_norm_sq = a_frob_norm * a_frob_norm;	
	
	// Limit case: null matrix
	if (a_frob_norm === 0) {
		return x_k;
	}
	
	// Preliminary computation of the squares of the 2-norms of the rows of A.
	var a_rows_two_norm_sq = typeof Float64Array === 'function' ? new Float64Array(m) : new Array(m);
	for (var i = 1; i <= m; ++i) {
		var a_i_two_norm = A.vectorNorm('two', 'row', i);
		a_rows_two_norm_sq[i-1] = a_i_two_norm * a_i_two_norm;
	}
	
	// Preliminary computation of the squares of the 2-norms of the columns of A.
	var a_columns_two_norm_sq = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n);
	for (var j = 1; j <= n; ++j) {
		var alpha_j_two_norm = A.vectorNorm('two', 'column', j);
		a_columns_two_norm_sq[j-1] = alpha_j_two_norm * alpha_j_two_norm;
	}
	
	// ------
	
	// Deterministic Extended Kaczmarz, c.f. algorithm R of the first reference.
	if (randomized == false) {
		// Main loop until convergence, guaranteed as per theorem 3.1 of the first reference.	
		var iter = 0;
		while (true) {
			// Update the number of iterations
			++iter;

			// Check the number of iterations
			if (maxIterations !== -1 && iter >= maxIterations) {
				throw new Error('maximum number of iterations reached: ' + maxIterations);
			}
						
			// Orthogonally project the current iterate x_k onto the solution hyperplane 
			// of <A(i,:)/x_k> = b(i) - z_k(i), i=1..m
			for (var i = 1; i <= m; ++i) {
				if (a_rows_two_norm_sq[i-1] == 0) {
					continue;
				}
				
				// Compute r_k = <A(i,:)/x_k> - (b(i) - z_k(i))
				var a_i_x_k = 0;
				for (var j = 1; j <= n; ++j) {
					a_i_x_k += A.data[(i-1) * A.nbColumns + (j-1)] * x_k.data[(j-1) * x_k.nbColumns];
				}
				var r_k = a_i_x_k - (b.data[(i-1) * b.nbColumns + 0] - z_k.data[(i-1) * z_k.nbColumns + 0]);
				
				// Update x_k: x_k+1 = x_k - r_k/||A(i,:)||_2^2 * A(i,:)
				for (var j = 1; j <= n; ++j) {
					x_k.data[(j-1) * x_k.nbColumns] -= r_k / a_rows_two_norm_sq[i-1] * A.data[(i-1) * A.nbColumns + (j-1)]; 
				}
			}

			// Orthogonally project the current iterate z_k onto the hyperplane generated 
			// by the columns A(:,j), j=1..n
			for (var j = 1; j <= n; ++j) {
				if (a_columns_two_norm_sq[j-1] == 0) {
					continue;
				}
				
				// Compute <A(:,j)/z_k>
				var a_j_z_k = 0;
				for (var i = 1; i <= m; ++i) {
					a_j_z_k += A.data[(i-1) * A.nbColumns + (j-1)] * z_k.data[(i-1) * z_k.nbColumns + 0];
				}
				
				// Update z_k: z_k+1 = z_k - <A(:,j)/z_k>/||A(:,j)||_2^2 * A(:,j)
				for (var i = 1; i <= m; ++i) {
					z_k.data[(i-1) * z_k.nbColumns + 0] -= a_j_z_k / a_columns_two_norm_sq[j-1] * A.data[(i-1) * A.nbColumns + (j-1)]; 
				}
			}
			
			// Convergence condition (adapted from formula 4.3 of the first reference):
			// - ||Ax_k - (b - z_k)||_2 <= eps * ||A||_f * ||x_k||_2
			
			// Compute ||x_k||_2
			var x_k_two_norm = x_k.vectorNorm('two');
			
			// Compute ||Ax_k - (b - z_k)||_2
			a_x_k =  Matrix_.xy(A, x_k, a_x_k);
			b_res = Matrix_.xmy(b, z_k, b_res);
			x_res = Matrix_.xmy(a_x_k, b_res, x_res);
			var x_res_two_norm = x_res.vectorNorm('two');
			
			// Test the convergence condition		
			if (x_res_two_norm <= eps * a_frob_norm * x_k_two_norm) {
				break;
			}
		}
	}
	
	// Randomized Extended Kaczmarz, c.f. algorithm 3 of the second reference.
	else {
		// Initializations
		var ta_z_k = Matrix_.zeros(n, 1); // A^t*z_k
		
		// ------

		// Preliminary computation of the probabilities q_i, with their associated sampler.
		var q = typeof Float64Array === 'function' ? new Float64Array(m) : new Array(m);
		for (var i = 1; i <= m; ++i) {
			q[i-1] = a_rows_two_norm_sq[i-1]/a_frob_norm_sq;
		}

		var qSampler = new aliasMethodSampler_(q);
	
		// Preliminary computation of theprobabilities p_j with their associated sampler.
		var p = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n);
		for (var j = 1; j <= n; ++j) {
			p[j-1] = a_columns_two_norm_sq[j-1]/a_frob_norm_sq;
		}
		var pSampler = new aliasMethodSampler_(p);
	
		
		// ------
		
		// Main loop until convergence, guaranteed as per theorem 4.1 of the second reference.	
		var iter = 0;
		while (true) {
			// Update the number of iterations
			++iter;

			// Check the number of iterations
			if (maxIterations !== -1 && iter >= maxIterations) {
				throw new Error('maximum number of iterations reached: ' + maxIterations);
			}
			
			// Pick a row index i with probability q_i
			var i = qSampler.sample() + 1;
			
			// Orthogonally project the current iterate x_k onto the solution hyperplane 
			// of <A(i,:)/x_k> = b(i) - z_k(i)
				// Compute r_k = <A(i,:)/x_k> - (b(i) - z_k(i))
			var a_i_x_k = 0;
			for (var j = 1; j <= n; ++j) {
				a_i_x_k += A.data[(i-1) * A.nbColumns + (j-1)] * x_k.data[(j-1) * x_k.nbColumns];
			}
			var r_k = a_i_x_k - (b.data[(i-1) * b.nbColumns + 0] - z_k.data[(i-1) * z_k.nbColumns + 0]);

				// Update x_k: x_k+1 = x_k - r_k/||A(i,:)||_2^2 * A(i,:)
			for (var j = 1; j <= n; ++j) {
				x_k.data[(j-1) * x_k.nbColumns] -= r_k / a_rows_two_norm_sq[i-1] * A.data[(i-1) * A.nbColumns + (j-1)]; 
			}
			
			// Pick a column index j with probability p_j
			var j = pSampler.sample() + 1;
			
			// Orthogonally project the current iterate z_k onto the hyperplane generated 
			// by the column A(:,j)
				// Compute <A(:,j)/z_k>
			var a_j_z_k = 0;
			for (var i = 1; i <= m; ++i) {
				a_j_z_k += A.data[(i-1) * A.nbColumns + (j-1)] * z_k.data[(i-1) * z_k.nbColumns + 0];
			}
			
				// Update z_k: z_k+1 = z_k - <A(:,j)/z_k>/||A(:,j)||_2^2 * A(:,j)
			for (var i = 1; i <= m; ++i) {
				z_k.data[(i-1) * z_k.nbColumns + 0] -= a_j_z_k / a_columns_two_norm_sq[j-1] * A.data[(i-1) * A.nbColumns + (j-1)]; 
			}

			// Convergence conditions every 8 min(m, n) iterations: 
			// - ||Ax_k - (b - z_k)||_2 <= eps * ||A||_f * ||x_k||_2
			// - ||A^tz_k||_2 <= eps * ||A||_f^2 * ||x_k||_2
			if (iter % 8 * Math.min(m, n) === 0) {
				// Compute ||x_k||_2
				var x_k_two_norm = x_k.vectorNorm('two');
				
				// Compute ||Ax_k - (b - z_k)||_2
				a_x_k =  Matrix_.xy(A, x_k, a_x_k);
				b_res = Matrix_.xmy(b, z_k, b_res);
				x_res = Matrix_.xmy(a_x_k, b_res, x_res);
				var x_res_two_norm = x_res.vectorNorm('two');
				
				// Compute ||A^tz_k||_2
				ta_z_k = Matrix_.txy(A, z_k, ta_z_k);
				var ta_z_k_two_norm = ta_z_k.vectorNorm('two');
				
				if (x_res_two_norm <= eps * a_frob_norm * x_k_two_norm && 
					ta_z_k_two_norm <= eps * a_frob_norm_sq * x_k_two_norm) {
					break;
				}
			}
		}
	}

	// ------
	
	// Return the computed solution
	return x_k;
}

/**
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */




/**
* @function meanVector
*
* @summary Returns the mean vector of series of values.
*
* @description This function computes the mean vector of series of values.
*
* @see <a href="https://en.wikipedia.org/wiki/Sample_mean_and_covariance">Sample mean and covariance</a>
* @see <a href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1891847">DeMiguel, Victor and Martin-Utrera, Alberto and Nogales, Francisco J., Size Matters: Optimal Calibration of Shrinkage Estimators for Portfolio Selection (July 21, 2011)</a>
*
* @param {Array.<Array.<number>>} arr an array of n arrays of m real numbers, with n and m natural integers
* greater than or equal to 1, with n representing the number of series (or features) and m representing the number of observations per series.
* @param {object} opt optional parameters for the mean vector computation.
* @param {string} opt.method the method to use to compute the mean vector, a string either equals to:
* - "sample-mean", in order to compute the sample mean vector, c.f. the first reference
* - "demiguel-shrinked-mean", in order to compute the optimal convex linear combination of the sample mean vector with a constant shrinkage target vector, c.f. the second reference
; defaults to "sample-mean"
*
* @return {Matrix_} a Matrix object representing the mean vector of the input series of values.
*
* @example
* meanVector([[0.05, 0.01, 0.01], [-0.05, 0.03, -0.01]]);
* // == Matrix_([0.023333333333333334, -0.010000000000000002])
*
*/
self.meanVector = function(arr, opt) {
	// Initialize default parameters
	var opt = opt;
	if (opt === undefined) {
		opt = { };
	}
	if (opt.method === undefined) {
		opt.method = "sample-mean";
	}
	
	// Decode the parameters
	var meanMethod = opt.method;
	if (meanMethod != "sample-mean" && meanMethod != "demiguel-shrinked-mean" ) {
			throw new Error('unsupported mean vector computation method');
	}

	
	//
	var nbSeries = arr.length;
	var nbObservations = arr[0].length;

	
	//
	var means;

	
	// In case the mean vector computation method is "sample-mean",
	// proceed with computing the mean of all series, c.f. the first reference.
	if (meanMethod == "sample-mean") {
		// Compute the sample mean vector
		var meanVector = Matrix_.fill(nbSeries, 1, function(i,j) { return mean_(arr[i-1]); });
		
		//
		means = meanVector;
	}
	else if (meanMethod == "demiguel-shrinked-mean") {
		// Compute the sample mean vector
		var meanVector = Matrix_.fill(nbSeries, 1, function(i,j) { return mean_(arr[i-1]); });
		
		// Compute the scaling factor nu, equal to the grand mean
		var nu = mean_(meanVector.toArray());
		
		// Compute the prior, a vector made of nu
		var prior = Matrix_.fill(nbSeries, 1, function(i,j) { return nu; });
		
		// Compute the optimal shrinkage intensity alpha, c.f. formula 6 of the second reference
		var variances = Matrix_.fill(nbSeries, 1, function(i,j) { return covariance_(arr[i-1], arr[i-1]); });
		var sigma_sq_b = variances.sum()/nbSeries;
		var alpha = nbSeries/nbObservations * sigma_sq_b / ( nbSeries/nbObservations * sigma_sq_b + Math.pow(Matrix_.xmy(prior, meanVector).vectorNorm('two'), 2) );

		// Compute the optimally shrinked mean vector,
		// c.f. formula 5 of the second reference.		
		means = Matrix_.axpby(alpha, prior, 1-alpha, meanVector);
	}
	else {
		throw new Error('internal error: unsupported mean vector computation method');
	}

	
	// Return the computed vector
	return means;
}


/**
* @function randomMeanVector
*
* @summary Returns a random mean vector.
*
* @description This function computes a random n by 1 mean vector, 
* using the unidimensional standard normal distribution to generate
* n independent random means.
* 
* @param {number} n the row length of the vector to construct, natural integer greater than or equal to 1.
*
* @return {Matrix_} the computed vector.
*
*/
self.randomMeanVector = function(n) {
	// Generate the random mean vector using the standard normal distribution
	var meanVect = Matrix_.fill(n, 1, function(i,j) { return normrnd_(0, 1); });
	
	// Return it
	return meanVect;
}


/**
* @function perturbedMeanVector
*
* @description This function computes a randomly perturbed version of an input mean vector,
* using the perturbation algorithm described in the first reference.
*
* @see <a href="https://jpm.pm-research.com/content/19/2/6">Chopra, Vijay K; Ziemba, William T; The effect of errors in means, variances, and covariances on optimal portfolio choice; Journal of Portfolio Management; Winter 1993; 19, 2</a>
*
* @param {Matrix_} an n by 1 Matrix representing the mean vector to perturb.
* @param {object} opt optional parameters for the perturbation algorithm.
* @param {string} opt.method the method to use to perturb the mean vector, a string either equals to:
* - "chopra-ziemba", in order to perturb the mean vector using independent standard normal random variables, c.f. the first reference
; defaults to "chopra-ziemba"
* @param {number} opt.k in case opt.method is equal to "chopra-ziemba", the quantity by which to multiply the standard normal random variable,
* a real number; defaults to 0.05
*
* @return {Matrix_} a Matrix object representing the perturbed mean vector.
*
* @example
* perturbedMeanVector([0.05, 0.01, 0.01]);
* // ~= Matrix_([0.04, 0.01, 0.0])
*
*/
self.perturbedMeanVector = function(meanVect, opt) {
	// Initialize default parameters
	var opt = opt;
	if (opt === undefined) {
		opt = { };
	}
	if (opt.method === undefined) {
		opt.method = "chopra-ziemba";
	}
	
	// Decode the parameters
	var method = opt.method;
	if (method != "chopra-ziemba") {
			throw new Error('unsupported perturbation method');
	}
	
	var k = opt.k;
	if (opt.k === undefined) {
		k = 0.05;
	}
	
	// The input matrix must be a vector
	if (!meanVect.isVector()) {
		throw new Error('input must be a vector');
	}
	
	// Generate the perturbed vector
	var perturbedMeanVect = meanVect.elemMap(function(i,j,val) { return val * (1 + k*normrnd_(0,1));})
	
	// Return it
	return perturbedMeanVect;
}




/**
* @author Roman Rubsamen <roman.rubsamen@gmail.com>
*/

 


/**
* @function randomVariances
*
* @summary Returns a random variances vector.
*
* @description  This function computes a random n by 1 variances vector, 
* using the unidimensional standard normal distribution with positive support to generate
* n independent random variances.
* 
* @param {number} n the row length of the vector to construct, natural integer greater than or equal to 1.
*
* @return {Matrix_} the computed vector.
*
*/
self.randomVariances = function(n) {
	// Generate the random standard deviations vector
	return Matrix_.fill(n, 1, function(i,j) { return pnormrnd_(0, 1); });	
}


/**
* @function perturbedVariances
*
* @description This function computes a randomly perturbed version of an input variances vector,
* using the perturbation algorithm described in the first reference.
*
* @see <a href="https://jpm.pm-research.com/content/19/2/6">Chopra, Vijay K; Ziemba, William T; The effect of errors in means, variances, and covariances on optimal portfolio choice; Journal of Portfolio Management; Winter 1993; 19, 2</a>
*
* @param {Matrix_} an n by 1 Matrix representing the variances vector to perturb.
* @param {object} opt optional parameters for the perturbation algorithm.
* @param {string} opt.method the method to use to perturb the standard deviations vector, a string either equals to:
* - "chopra-ziemba", in order to perturb the standard deviations vector using independent standard normal random variables, c.f. the first reference
; defaults to "chopra-ziemba"
* @param {number} opt.k in case opt.method is equal to "chopra-ziemba", the quantity by which to multiply the standard normal random variable,
* a real number; defaults to 0.05
*
* @return {Matrix_} a Matrix object representing the perturbed variances vector.
*
* @example
* perturbedVariances([0.05, 0.01, 0.01]);
* // ~= Matrix_([0.04, 0.01, 0.0])
*
*/
self.perturbedVariances = function(variancesVect, opt) {
	// Initialize default parameters
	var opt = opt;
	if (opt === undefined) {
		opt = { };
	}
	if (opt.method === undefined) {
		opt.method = "chopra-ziemba";
	}
	
	// Decode the parameters
	var method = opt.method;
	if (method != "chopra-ziemba") {
			throw new Error('unsupported perturbation method');
	}
	
	var k = opt.k;
	if (opt.k === undefined) {
		k = 0.05;
	}
	
	// The input matrix must be a vector
	if (!variancesVect.isVector()) {
		throw new Error('input must be a vector');
	}
	
	// Generate the perturbed vector
	var perturbedVariancesVect = variancesVect.elemMap(function(i,j,val) { 
	                                                       var pvar = val * (1 + k*normrnd_(0,1)); 
	                                                       while (pvar == 0) { 
														       pvar = val * (1 + k*normrnd_(0,1));
														   }
														   return pvar;
													   })
	
	// Return it
	return perturbedVariancesVect;
}



/**
 * @file Functions related to bit set object.
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 


/**
* @function BitSet_
*
* @summary Construct a bit set.
*
* @description This function constructs either a bit set with its bits 
* initialized to the values contained in the optional input array arr
* made of natural integers, or an empty bit set if the array arr is
* not provided.
* 
* A bit set (a.k.a. bit array, bit vector) is a data structure tailored 
* to storing (relatively small) integers.
*
* The internal way to handle bit sets has been fully adapted from: 
* - https://github.com/infusion/BitSet.js
* - https://github.com/lemire/FastBitSet.js
*
* @see <a href="https://en.wikipedia.org/wiki/Bit_array">Bit array</a>
*
* @param {Array.<number>} arr, an optional array of natural integers.
* @return {this} the constructed bit set.
*
* @example
* var myBitSet = new BitSet_();
*
* var myBitSet = new BitSet_([1, 3, 4]);
*/
function BitSet_(arr) {
	function fromArray(arr) {
		// Fill the bitset
		for (var i = 0; i < arr.length; ++i) {
			that.set(arr[i]);
		}
	}
	
    // Catches incorrect usage of var b = BitSet_() instead of var b = new BitSet_()
	if (!(this instanceof BitSet_)) {
      return new BitSet_();
    }

	// The number of bits hold in a word
	this.WORD_LENGTH = 32;

	// The log base 2 of WORD_LENGTH
	this.WORD_LOG = 5;
	
	// The "list" of words hold by the BitSet
	this.words = typeof Uint32Array === 'function' ? new Uint32Array(0) : new Array(0);
	
	// For subsequent usage in initialization sub-functions
	var that = this;
	
	// Specific process in case the input is provided and is an array
	if (arr instanceof Array || (typeof Uint32Array === 'function' && arr instanceof Uint32Array)) {
		fromArray(arr);
	}
	
	/**
	* @function iterator
	*
	* @summary Returns an iterator to compute the indexes
	* corresponding to the bits set to 1 in the bit set.
	*
	* @description This function constructs an iterator to compute the indexes
	* corresponding to the bits set to 1 in the bit set.
	*
	* To be noted that once an index corresponding to a bit set to 1 has been
	* iterated over by the iterator, this index and all the indexes lower than
	* this index can be altered (i.e., set to 0) without invalidating the iterator.
	*
	* @memberof BitSet_
	* @return {function} a function to be used as an iterator through its .next() method, computing  
	* the indexes corresponding to the bits set to 1 in the bit set.
	*
	* @example
	* var myBitSet = new BitSet_().add(2);
	* var myIterator = new myBitSet.iterator();
	* myIterator.next(); myIterator.next();
	* // 2; 0;
	*/
	this.iterator = function() {
		// Initialize the current words index and the current word to
		// the first non-null word, if existing.
		this.w_idx = -1;
		this.w = 0;
		while (this.w_idx < that.words.length && this.w == 0) {
			++this.w_idx;
			this.w = that.words[this.w_idx];
		}

		/**
		* @function next
		*
		* @summary Returns the index corresponding to the next bit set to 1 in the bit set.
		*
		* @description This function computes the index corresponding to the next bit set to 1
		* in the bit set.
		*
		* The initial index computed by the first call to this function is the index corresponding
		* to the first bit set to 1, and each subsequent call to this function will result in computing
		* the index corresponding to the next bit set to 1, in increasing order, until the index 
		* corresponding to the last bit set to 1 is reached.
		*
		* A subsequent call to this function when the index corresponding to the last bit set to 1
		* has been reached will result in 0 being returned.
		*
		* @memberof BitSet_.iterator
		* @return {number} a natural integer corresponding to the index of the computed bit set to 1 
		* or 0 in case all the bits set to 1 have already been iterated over.
		*/
		this.next = function() {
			// If the end of the bit set has already been reached, there is nothing more to do
			if (this.w_idx == that.words.length) {
				return 0;
			}			
			
			// Otherwise, extract the next bit set to 1 and compute its associated index, from the current
			// remaining word.
			var t = this.w & -this.w;
			var value = (this.w_idx << that.WORD_LOG) + BitSet_.populationCount((t - 1) | 0);
			this.w ^= t;
			
			// In case the current word has been exhausted, next iteration needs to
			// take place on the next non-null word, if existing.
			while (this.w_idx < that.words.length && this.w == 0) {
				++this.w_idx;
				this.w = that.words[this.w_idx];
			}
		
			// If the end of the bit set is reached, no subsequent call to .next are necessary
			return value;
		}
	}
}

/**
* @function populationCount_
*
* @summary Return the number of 1-bits in a 32-bit word.
*
* @description This function computes the number of 1-bits in a 32-bit word,
* using the formula 5-2 of the chapter 5 of the reference.
*
* @see Warren, H. (2009), Hacker`s Delight, New York, NY: Addison-Wesley
* 
* @param {number} x a 32-bit word.
* @return {number} the number of bits set to 1 in the binary representation of x.
*
* @example
* populationCount_(5);
* // 2
*/
BitSet_.populationCount = function(x) {
	x = x - ((x >>> 1) & 0x55555555);
	x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
	x = (x + (x >>> 4)) & 0x0F0F0F0F;
	x = x + (x >>> 8);
	x = x + (x >>> 16);
	return x & 0x0000003F;
};

BitSet_.prototype = {
    constructor: BitSet_,

	/**
	* @function resize
	*
	* @summary Resize the bit set.
	*
	* @description This function resizes the bit set so that
	* the bit corresponding to an index is stored within the bit set.
	*
	* @memberof BitSet_
	* @param {number} idx the index of the bit to be stored within the bit set, 
	* a natural integer.
	*
	* @example
	* resize_(123);
	* // 
	*/
	resize : function(idx) {
	    // Short circuit in case there is nothing to do
		var c = this.words.length;
		if ((c << this.WORD_LOG) > idx) {
			return;
		}
		
		// Compute the total number of words needed in order to
		// store the bit corresponding to the index provided in input.
	    var count = (idx + this.WORD_LENGTH) >>> this.WORD_LOG;
		
		// Depending on whether typed arrays are supported by the JavaScript
		// engine, resize the bit set differently.
		if (typeof Uint32Array === 'function') {
			var words_new = new Uint32Array(count); // the new typed array is (automatically) initialized with 0s
			words_new.set(this.words); // copy the previous words into the new typed array
			this.words = words_new;
		}
		else {  
			// Expand the array
			this.words[count-1] = 0; // copy (automatically) the previous words into the new array
			
			// Fill the expanded array with 0s
			for (var i = c; i < count-1; ++i) {
				this.words[i] = 0;
			}
		}
	},
	
	/**
	* @function toString
	*
	* @summary Return a string representation of the bit set as 0s and 1s.
	*
	* @description This function builds a base-2 string representation of
	* the bit set.
	* 
	* @memberof BitSet_
	* @return {string} a base-2 string representation of the bit set' content.
	*
	* @example
	* BitSet_().add(5).toString()
	* // 00000000000000000000000000000101
	*/
	toString: function () {
		// Initialize the final string
		var fullStr = '';

		// Concatenate the base-2 representation of each word hold by the bit set, 
		// possibly padded with leading WORD_LENGTH 0s.
		var c = this.words.length;
		for (var i = 0; i < c; ++i) {
			// Compute the base-2 string representation of the i-th word of the bit set.
			//
			// Note: if the underlying array of words is a standard array, words greater than
			// 2^(this.WORD_LENGTH-1)-1 will be considered as negative by the toString(2)
			// method below, so that the unsigned right shift bitwise operator (>>>) is
			// used to coerce the word to an unsigned integer.
			//
			// C.f. https://stackoverflow.com/questions/9939760/how-do-i-convert-an-integer-to-binary-in-javascript
			var str = "";
			if (typeof Uint32Array === 'function') {
				str = this.words[i].toString(2);
			}
			else {
				str = (this.words[i] >>> 0).toString(2);
			}

			// Concatenate the (possibly) padded string above with the other words
			// already built.
			fullStr += str.length >= this.WORD_LENGTH ? str : new Array(this.WORD_LENGTH - str.length + 1).join('0') + str;
		}

		// Return the computed string
		return fullStr;
	},

	/**
	* @function set
	*
	* @summary Set a single bit to 1.
	*
	* @description This function sets the bit corresponding to an index to 1.
	* 
	* @memberof BitSet_
	* @param {number} idx the index of the bit to set to 1, a natural integer.
	* @return {BitSet_} this.
	*
	* @example
	* BitSet_().set(5)
	* //
	*/
	set: function(idx) {
		// Logic to transparently grow the bit set
		var c = this.words.length;
		if ((c << this.WORD_LOG) <= idx) {
			this.resize(idx);
		}
		
		// Set the proper bit to 1, in the proper word
		this.words[idx >>> this.WORD_LOG] |= (1 << idx);
		
		// Return the altered bit set
		return this;
	},

	/**
	* @function setRange
	*
	* @summary Set a continuous range of bits to 1.
	*
	* @description This function sets the bits within a continuous range of indexes to 1.
	* 
	* @memberof BitSet_
	* @param {number} idxFrom the index of the first bit to set to 1, a natural integer.
	* @param {number} idxTo the index of the last bit to set to 1, a natural integer greater than or equal to idxFrom.
	* @return {BitSet_} this.
	*
	* @example
	* BitSet_().setRange(5, 10)
	* //
	*/
	setRange: function (idxFrom, idxTo) {
		// Logic to transparently grow the bit set
		var c = this.words.length;
		if ((c << this.WORD_LOG) <= idxTo) {
			this.resize(idxTo);
		}
	  
		// Set the proper bits to 1, in the proper words
		for (var i = idxFrom; i <= idxTo; ++i) {
			this.words[i >>> this.WORD_LOG] |= (1 << i);
		}

		// Return the altered bit set
		return this;
	},
	
	/**
	* @function unset
	*
	* @summary Set a single bit to 0.
	*
	* @description This function sets the bit corresponding to an index to 0.
	* 
	* @memberof BitSet_
	* @param {number} idx the index of the bit to set to 0, a natural integer.
	* @return {BitSet_} this.
	*
	* @example
	* BitSet_().unset(5)
	* //
	*/
	unset: function(idx) {
		// Logic to transparently grow the bit set
		var c = this.words.length;
		if ((c << this.WORD_LOG) <= idx) {
			this.resize(idx);
		}
		
		// Set the proper bit to 0, in the proper word
		this.words[idx >>> this.WORD_LOG] &= ~(1 << idx);
		
		// Return the altered bit set
		return this;
	},

	/**
	* @function get
	*
	* @summary Return the bit corresponding to an index.
	*
	* @description This function returns the bit corresponding to an index.
	* 
	* @memberof BitSet_
	* @param {number} idx the index of the bit to retrieve, a natural integer.
	* @return {boolean} true if the bit corresponding to the index idx is set to true,
	* false if the bit corresponding to the index idx does not exist in the bit set 
	* or is set to false.
	*
	* @example
	* BitSet_().set(5).get(5)
	* // true
	*/
	get: function(idx) {
		return (this.words[idx  >>> this.WORD_LOG] & (1 << idx)) !== 0;
	},	
	
	/**
	* @function clear
	*
	* @summary Clear the bit set.
	*
	* @description This function clears the bit set by resetting it to 0.
	* 
	* @memberof BitSet_
	* @return {BitSet_} this.
	*
	* @example
	* BitSet_().clear()
	* //
	*/
	clear: function() {
		// Re-initialize the bit set
		this.words = typeof Uint32Array === 'function' ? new Uint32Array(0) : new Array(0);
		
		// Return the altered bit set
		return this;
	},
	
	/**
	* @function flip
	*
	* @summary Flip/toggle the value of a single bit.
	*
	* @description This function flips/toggles the value of the bit corresponding to
	* an index.
	* 
	* @memberof BitSet_
	* @param {number} idx the index of the bit to flipt/toggle, a natural integer.
	* @return {BitSet_} this.
	*
	* @example
	* BitSet_().flip(5)
	* //
	*/
	flip: function(idx) {
		// Logic to transparently grow the bit set
		var c = this.words.length;
		if ((c << this.WORD_LOG) <= idx) {
			this.resize(idx);
		}
		
	  // Set the proper bit to its boolean negation, in the proper word
	  this.words[idx >>> this.WORD_LOG] ^= 1 << idx;
	  
	  // Return the altered bit set
	  return this;
	},
	 
	/**
	* @function isEmpty
	*
	* @summary Determine whether the bit set is empty.
	*
	* @description This function determines whether the bit set is empty
	* (i.e., has no bit set to 1).
	* 
	* @memberof BitSet_
	* @return {boolean} true if the bit set is empty, false otherwise.
	*
	* @example
	* BitSet_().set(5).isEmpty()
	* // false
	*/
	isEmpty: function() {
	  // Loop over all the words help by the bit set to detetmine
	  // if there is a non-null word.
	  var c = this.words.length;
	  for (var  i = 0; i < c; ++i) {
		if (this.words[i] != 0) {
			return false;
		}
	  }
	  
	  // Arrived here, the bit set has only null words (if any), so that
	  // it is empty.
	  return true;
	},

	/**
	* @function nbSetBits
	*
	* @summary Compute the number of bits set to 1.
	*
	* @description This function computes the number of bits set to 1 in the bit set.
	* 
	* @memberof BitSet_
	* @return {number} the number of bits set to 1 in the bit set, a natural integer.
	*
	* @example
	* BitSet_().set(5).nbSetBits()
	* // 1
	*/
	nbSetBits: function() {
	  // Loop over all the words help by the bit set and compute their
	  // number of bits set to 1 thanks to the populationCount function.
	  var s = 0;
	  var c = this.words.length;
	  for (var i = 0; i < c; ++i) {
		s += BitSet_.populationCount(this.words[i] | 0);
	  }
	  
	  // Return the computed value
	  return s;
	},

	/**
	* @function toArray
	*
	* @summary Return an array representation of the bit set.
	*
	* @description This function builds an array representation of the bit set,
	* which contains the indexes of the bits set to 1 in increasing order.
	* 
	* @memberof BitSet_
	* @return {Uint32Array<number>} an array representation of the bit set' content, 
	* a newly allocated array of length the number of bits set to 1 in the
	* bit set.
	*
	* @example
	* BitSet_().add(5).add(10).toArray()
	* // [5, 10]
	*/
	toArray: function() {
	  // Initialize the output array, and its associated elements pointer
	  var arr = new Array(this.nbSetBits());
	  var pos = 0;
	  
	  // Loop over all the words help by the bit set 
	  var c = this.words.length;
	  for (var i = 0; i < c; ++i) {
		var w = this.words[i];
		
		// For each word help by the bit set, extract the bits set to 1
		// and compute their associated index.
		while (w != 0) {
		  var t = w & -w;
		  arr[pos++] = (i << this.WORD_LOG) + BitSet_.populationCount((t - 1) | 0);
		  w ^= t;
		}
	  }
	  
	  // Return the computed array
	  return arr;
	},

};

/**
* @author Roman Rubsamen <roman.rubsamen@gmail.com>
*/

 

 
 
/**
* @function aliasMethodSampler_
*
* @summary Returns a function to generate random values sampled from a discrete
* finite probability distribution.
*
* @description This function constructs a function to generate random values from the set
* {0,...,n-1} sampled according to the provided discrete finite probability distribution
* {p_0,...,p_n-1}.
* 
* The algorithm used is the Vose's algorithm, which is a variation of the alias method
* allowing to sample random values from a finite discrete probability distribution in O(1) time
* after a O(n) time preprocessing step, c.f. the reference.
* 
* @see <a href="https://doi.org/10.1109/32.92917">M. D. Vose, A linear algorithm for generating random numbers 
* with a given distribution, IEEE Transactions on Software Engineering, vol. 17, no. 9, pp. 972-975, Sep 1991.</a>
*
* @param {Array.<number>} p, an array of n positive real numbers p_0,...,p_n-1 with sum_i p_i = 1.
* @return {function} a function to be used through its .sample() method, generating an integer i from the set
* {0,...,n-1} with probability p_i.
*
* @example
* var mySampler = new aliasMethodSampler_([0, 0.1, 0.4, 0.5]);
* mySampler.sample();
* // 3;
*/
function aliasMethodSampler_(p) {
	// ----
	// init function, c.f. paragraph B of section III of the reference.
	// ----

	// Initializations.
	this.prob = typeof Float64Array === 'function' ? new Float64Array(p.length) : new Array(p.length);
	this.alias = typeof Uint32Array === 'function' ? new Uint32Array(p.length) : new Array(p.length);

	// TODO: Checks on probabilities (positive, sum to one)

	// Computation of the average probability.
    var avgProb = 1 / p.length;
		 
	// Initializations of the small and large stacks, together with their associated indexes.
	var small = typeof Uint32Array === 'function' ? new Uint32Array(p.length) : new Array(p.length);
	var s = 0;
	var large = typeof Uint32Array === 'function' ? new Uint32Array(p.length) : new Array(p.length);
	var l = 0;
		
	// Population of the small and large stacks with the probabilities indexes.
	for (var j = 0; j < p.length; ++j) {
		if (p[j] > avgProb) {
			large[l] = j;
			++l;
		}
		else {
			small[s] = j;
			++s;
		}
	}
		
	// Main loop of the algorithm, populating the prob and alias arrays.
	var p = p.slice(0); // local copy of the probabilities, as they are updated below
	while (s > 0 && l > 0) {
		// Get the index of the small and the large probabilities.
		--s;
		var j = small[s];
		
		--l;
		var k = large[l];
		
		// Update the prob and alias arrays.
		this.prob[j] = p.length * p[j];
		this.alias[j] = k;
		
		// Update the probabilities.
		p[k] = p[k] + (p[j] - avgProb);
		
		// Update the large and small stacks.
		if (p[k] > avgProb) {
			large[l] = k;
			++l;
		}
		else {
			small[s]= k;
			++s;
		}
	}
		
	// Process the remaining elements of the small stack.
	while (s > 0) {
		--s;
		this.prob[small[s]] = 1;
	}
	
	// Process the remaining elements of the large stack.
	//
	// Theoretically not needed, but due to round off errors, practicaly needed.
	while (l > 0) {
		--l;
		this.prob[large[l]] = 1;
	}
	
	
	// ----
	// rand function, c.f. paragraph A of section III of the reference.
	// ----
	
	/**
	* @function sample
	*
	* @summary Returns a random value sampled from the underlying probability distribution.
	*
	* @description This function computes a random value sampled from the underlying 
	* probability distribution using the method described in the reference.
	*
	* @memberof aliasMethodSampler_
	* @return {number} an integer i belonging to the set {0,...,n-1} with probability p_i.
	*/
    this.sample = function() {
		var u = Math.random() * this.prob.length; // Uniform real number belonging to [0..n[
		var j = Math.floor(u);
		if (u - j <= this.prob[j]) {
			return j;
		}
		else {
			return this.alias[j];
		}
    }
}

	
/**
* @function compositionsIterator_
*
* @summary Returns an iterator to compute all the compositions of a non negative integer.
*
* @description This function constructs an iterator to compute all the k-compositions of a non-negative integer n, 
* using the algorithm NEXCOM described in section 5 of the first reference.
*
* @see Nijenhuis, A., & Wilf, H. S. (1978). Combinatorial algorithms for computers and calculators. 2d ed. New York: Academic Press.
* @see <a href="https://en.wikipedia.org/wiki/Composition_(combinatorics)">Composition (combinatorics)</a>
*
* @param {number} n a non-negative integer whose composition are desired.
* @param {number} k a non-negative integer indicating the number of parts of desired composition of n.
* @param {boolean} reuseOutputArray an optional boolean that can be set to true to re-use the same output array throughout
* all the computations (this improves the performances, but requires the caller to NOT alter the output array); defaults to false.
* @return {function} a function to be used as an iterator through its .next() method, computing all 
* the k-compositions of n until they all have been exhausted, in which case -1 is returned.
*
* @example
* var myIterator = new compositionsIterator_(6, 3);
* myIterator.next(); myIterator.next();
* // [6,0,0]; [5,1,0];
*/
function compositionsIterator_(n, k, reuseOutputArray) {
	// Initialize n and k
	this.n = n;
	this.k = k;
	
	// Initialize the re-use array variable
	this.reuseOutputArray = reuseOutputArray;
	
	// Variables required for NEXTCOM internal computations,
	// initialized so as to generate the first composition upon
	// the first call to .next() function.
	this.firstcall = true;
	this.mtc = false;
	this.r = typeof Uint32Array === 'function' ? new Uint32Array(k) : new Array(k);
	this.t = this.n;
	this.h = 0;

	/**
	* @function next
	*
	* @summary Returns the next composition of a non negative integer.
	*
	* @description This function computes the next k-composition of a non negative integer n.
	*
	* The initial k-composition computed by the first call to this function is n00...0, and each subsequent call to 
	* this function will result in a new k-composition until the final k-composition 00...0n is reached.
	*
	* A subsequent call to this function when the final k-composition has been reached will result in
	* the function returning -1.
	*
	* @memberof compositionsIterator_
	* @return {Array.<number>|number} either an array containing a newly generated k-composition
	* of the integer n or -1 to indicate that all the k-compositions have already been generated.
	*/
	this.next = function() {
		if (!this.firstcall && !this.mtc) {
			// No more k-compositions to generate
			return -1;
		}
		
		if (this.firstcall) {		
			// The first call has now been made
			this.firstcall = false;
			
			// Fill the k-compositions array with the first composition equals to n00...0
			this.r[0] = this.n;
			for (var i = 1; i <= this.k - 1; ++i) {
				this.r[i] = 0;
			}	
		}
		else {
			// There is still a composition to generate
			if (this.t > 1) {
				this.h = 0;
			}
			++this.h;
			this.t = this.r[this.h - 1];
			this.r[this.h - 1] = 0;
			this.r[0] = this.t - 1;
			++this.r[this.h];
		}
		
		// End logic
		this.mtc = (this.r[this.k - 1] != this.n);
		
		// Return either the r array, or a copy of the r array, so that callers can alter it
		if (this.reuseOutputArray) {
			return this.r;
		}
		else {
			return this.r.slice(0);
		}
	}
}


/**
* @function permutationsIterator_
*
* @summary Returns an iterator to compute all the permutations of letters.
*
* @description This function constructs an iterator to compute all the permutations of 
* the set {1..n} (equivalent to a set of n letters), using the Heap's algorithm described in the second
* reference.
*
* @see <a href="https://doi.org/10.1093/comjnl/6.3.293">B. R. Heap, Permutations by Interchanges, 
* The Computer Journal, Volume 6, Issue 3, November 1963, Pages 293–298</a>
* @see <a href="https://dx.doi.org/10.1145%2F356689.356692">R. Sedgewick, Permutation Generation Methods, 
* Computing Surveys, Vol 9, No 2, June 1977</a>
*
* @param {number} n a non-negative integer.
* @param {boolean} reuseOutputArray an optional boolean that can be set to true to re-use the same output array throughout
* all the computations(this improves the performances, but requires the caller to NOT alter the output array); defaults to false.
* @return {function} a function to be used as an iterator through its .next() method, computing all 
* the permutations of the set {1..n} until they all have been exhausted, in which case -1 is returned.
*
* @example
* var myIterator = new permutationsIterator_(2);
* myIterator.next();myIterator.next();myIterator.next();
* // [1,2]; [2,1];-1
*/
function permutationsIterator_(n, reuseOutputArray) {
	// Initialize n
	this.n = n;
	
	// Initialize the re-use array variable
	this.reuseOutputArray = reuseOutputArray;
	
	// Initialize the array holding the permutation to 1..n
	this.p = typeof Uint32Array === 'function' ? new Uint32Array(this.n) : new Array(this.n);
	for (var i = 0; i < this.n; ++i) {
		this.p[i] = i+1;
	}
	
	// Initialize the array holding the recursion stack to 0's
	this.c = typeof Uint32Array === 'function' ? new Uint32Array(this.n) : new Array(this.n);
	for (var i = 0; i < this.n; ++i) {
		this.c[i] = 0;
	}

	// Initialize the iteration counter
	this.j = -1;
	
	/*
	* @function next
	*
	* @summary Returns the next permutation of the set {1..n}, as constructed by the Heap's algorithm.
	*
	* @description This function computes the next permutation of the set {1..n}, using
	* the Heap's algorithm described in the second reference.
	*
	* @memberof randomPermutationIterator_
	* @return {Array.<number>|Uint32Array} an array of n elements containing the computed next permutation of the set {1..n}.
	*/
	this.next = function() {	
		// No more permutations to generate
		if (this.j >= this.n) {
			return -1;
		}
		
		// First call
		if (this.j === -1) {
			++this.j;
			
			// Return either the p array, or a copy of the p array, so that callers can alter it
			if (this.reuseOutputArray) {
				return this.p;
			}
			else {
				return this.p.slice(0);
			}
		}
		else {
			// Main logic of the Heap's algorithm
			while (this.j < this.n) {
				if (this.c[this.j] < this.j) {
					// Swap step
					if (this.j % 2 === 0) { // j is even, swap P(j) and P(0)
						var tmp = this.p[this.j];
						this.p[this.j] = this.p[0];
						this.p[0] = tmp;
					}
					else { // j is odd, swap P(j) and P(c(j))
						var tmp = this.p[this.j];
						this.p[this.j] = this.p[this.c[this.j]];
						this.p[this.c[this.j]] = tmp;
					}
					
					// A new permutation has been computed:
					// - Increment the iteration counter for the current recursion level, 
					// and revert to the base case of the recursion
					++this.c[this.j];
					this.j = 0;
					
					// - Return either the p array, or a copy of the p array, so that callers can alter it
					if (this.reuseOutputArray) {
						return this.p;
					}
					else {
						return this.p.slice(0);
					}
				}
				else {
					// Recursion level j is finished, so:
					// - Reset the iteration counter for the recursion level j
					// - Get back to the previous recursion level
					this.c[this.j] = 0;
					++this.j;
				}
			}
			
			// No more permutations to generate
			return -1;
		}
	}
}


/**
* @function randomCompositionsIterator_
*
* @summary Returns an infinite iterator to compute random compositions of a non negative integer.
*
* @description This function constructs an infinite iterator to compute random k-compositions of a non-negative integer n, 
* using the algorithm RANCOM described in section 6 of the first reference.
*
* Since the algorithm used internally to generate random k-subsets is uniform, the random k-compositions
* are most probably generated uniformly at random, but this is not proven in the reference.
*
* @see Nijenhuis, A., & Wilf, H. S. (1978). Combinatorial algorithms for computers and calculators. 2d ed. New York: Academic Press.
* @see <a href="https://en.wikipedia.org/wiki/Composition_(combinatorics)">Composition (combinatorics)</a>
*
* @param {number} n a non-negative integer whose composition are desired.
* @param {number} k a non-negative integer indicating the number of parts of desired composition of n.
* @return {function} a function to be used as an infinite iterator through its .next() method, computing  
* random k-compositions of n.
*
* @example
* var myIterator = new randomCompositionsIterator_(6, 3);
* myIterator.next();
* // [2,1,3]
*/
function randomCompositionsIterator_(n, k) {
	// Initialize n and k
	this.n = n;
	this.k = k;
	
	// Initialize the uniform random k-subset iterator
	this.ranksb = new randomKSubsetsIterator_(n+k-1, k-1);
	
	// Initialize the array holding the k-compositions
	this.r = typeof Uint32Array === 'function' ? new Uint32Array(k) : new Array(k);

	/*
	* @function next
	*
	* @summary Returns a random composition of a non negative integer.
	*
	* @description This function computes a random k-composition of a non negative integer n, using
	* the algorithm RANCOM described in section 5 of the first reference, with the call to RANKSB
	* replaced with a call to the method D of Vitter.
	*
	* @memberof randomCompositionsIterator_
	* @return {Array.<number>|Uint32Array} an array of k elements containing the computed random k-composition of n.
	*/
	this.next = function() {
		// Call to RANKSB
		var rr = this.ranksb.next();
		
		// Copy of the generated random (k-1)-subset into the array r
		for (var i = 0; i < this.k-1; ++i) {
			this.r[i] = rr[i];
		}
		
		// Initialization of the k-th element of r
		this.r[this.k-1] = this.n + this.k;
		
		// Filling of the array r
		var l = 0;
		for (var i = 1; i <= this.k; ++i) {
			var m = this.r[i-1];
			this.r[i-1] = m - l - 1;
			l = m;
		}
		
		// Return a copy of the r array, so that the caller can alter it
		return this.r.slice(0);
	}
}


/**
* @function randomPermutationsIterator_
*
* @summary Returns an infinite iterator to compute random permutations.
*
* @description This function constructs an infinite iterator to compute random permutations of 
* the set {1,2,...,n} (equivalent to a set of n letters) or of the elements of any set, 
* using the algorithm RANPER described in section 8 of the reference.
*
* The random permutations are generated uniformly at random.
*
* @see Nijenhuis, A., & Wilf, H. S. (1978). Combinatorial algorithms for computers and calculators. 2d ed. New York: Academic Press.
*
* @param {number} n a non-negative integer.
* @param {Array.<Object>} outputArray an optional array containing elements to be randomly permuted.
* @param {boolean} reuseOutputArray an optional boolean that can be set to true to re-use the same output array throughout
* all the computations (this improves the performances, but requires the caller to NOT alter the output array); defaults to false.
*
* @return {function} a function to be used as an infinite iterator through its .next() method, computing  
* random permutations of the array [1,2,...,n] if outputArray is not provided, or random permutations of the array 
* outputArray if outputArray is provided.
*
* @example
* var myIterator = new randomPermutationsIterator_(6);
* myIterator.next();
* // [1,3,2,4,6,5]
*/
function randomPermutationsIterator_(n, outputArray, reuseOutputArray) {
	// Initialize the array holding the permutation to 1..n, if needed
	if (outputArray === undefined) {
		this.r = typeof Uint32Array === 'function' ? new Uint32Array(n) : new Array(n);
		for (var i = 0; i < n; ++i) {
			this.r[i] = i+1;
		}
	}
	else {
		this.r = outputArray;
	}
	this.rrlen = this.r.length;
	
	// Initialize the re-use array variable
	this.reuseOutputArray = reuseOutputArray;


	/**
	* @function uniformrv
	*
	* @summary Returns a number generated uniformly at random in interval ]0,1[.
	*
	* @description This function computes a number uniformly at random in interval ]0,1[.
	*
	* @memberof randomPermutationsIterator_
	* @return {number} a number generated uniformly at random in interval ]0,1[, a real number
	*
	*/
	function uniformrv() {
		// Generate a random number in the [0, 1[ interval
		var rnd = Math.random();
		
		// While the generated random number is (exactly) equal to 0,
		// reject it.
		while (rnd === 0) {
			rnd = Math.random();
		}
		
		// Return the generated random number, which is then 
		// generated uniformly at random in the ]0,1[ interval.
		return rnd;
	}
	
	/**
	* @function next TOODO
	*
	* @summary Returns a random permutation of the set {1..n}.
	*
	* @description This function computes a random permutation of the set {1..n}, using
	* the algorithm RANPER described in section 8 of the reference.
	*
	* @memberof randomPermutationsIterator_
	* @return {Array.<number>|Uint32Array} an array of n elements containing the computed random permutation of the set {1..n}.
	*/
	this.next = function() {
		// Construct a copy of the r array so that the caller can alter it, if applicable
		if (this.reuseOutputArray) {
			var rr = this.r;
		}
		else {
			var rr = this.r.slice(0);
		}
		
		// Main logic of the RANPER algorithm
		for (var m = 1; m <= this.rrlen; ++m) {
			var l = m + Math.floor( uniformrv()*(this.rrlen + 1 - m) );
			
			var tmp = rr[l-1];
			rr[l-1] = rr[m-1];
			rr[m-1] = tmp;
		}

		// Return the possibly altered copy of the r array
		return rr;
	}
}


/**
* @function kSubsetsIterator_
*
* @summary Returns an iterator to compute all the k-subsets of a n-set.
*
* @description This function constructs an iterator to compute all the k-subsets of the n-set {1,...,n}, 
* using the algorithm NEXKSB described in section 3 of the first reference.
*
* @see Nijenhuis, A., & Wilf, H. S. (1978). Combinatorial algorithms for computers and calculators. 2d ed. New York: Academic Press.
* @see <a href="https://en.wikipedia.org/wiki/Power_set">Power set</a>
*
* @param {number} n the number of elements of the n-set {1,...,n} whose k-subsets are desired, a non-negative integer.
* @param {number} k a non-negative integer, with 1 <= k <= n.
* @param {boolean} useArrayCopy an optional boolean that can be set to false to re-use the same output array throughout
* all the computations(this improves the performances, but requires the caller to NOT alter the output array); defaults to true.
* @return {function} a function to be used as an iterator through its .next() method, computing all the 
* k-subsets of the n-set {1,...,n} in lexicographic order, until they all have been exhausted, in which case
* -1 is returned.
*
* @example
* var myIterator = new kSubsetsIterator_(5, 3);
* myIterator.next(); myIterator.next();
* // [1, 2, 3]; [1, 2, 4]; ...; -1
*/
function kSubsetsIterator_(n, k, useArrayCopy) {
	// Initialize n and k
	this.n = n;
	this.k = k;

	// Initialize the copy array variable
	this.useArrayCopy = useArrayCopy;
	
	// Initialize the array to hold the k-subsets
	this.a = typeof Uint32Array === 'function' ? new Uint32Array(k) : new Array(k);
	
	// Variables required for NEXKSB internal computations,
	// initialized so as to generate the first subset upon
	// the first call to .next() function.
	this.firstcall = true;
	this.mtc = false;
	this.m2 = 0;
	this.h = this.k;
	this.endval = this.n - this.k + 1;	
	
	/**
	* @function next
	*
	* @summary Returns the next k-subset of a set.
	*
	* @description This function computes the next k-subset of the n-set {1,...,n},
	* in lexicographic order.
	*
	* The initial k-subset computed by the first call to this function is the subset {1,...,k}, 
	* and each subsequent call to this function will result in a new k-subset until the final 
	* k-subset {n-k+1,...,n} is reached.
	*
	* A subsequent call to this function when the final k-subset has been reached will result in
	* the function returning -1.
	*
	* @memberof kSubsetsIterator_
	* @return {Array.<number>|number} either an array containing a newly computed sorted k-subset
	* of the n-set {1,...,n} or -1 to indicate that all the k-subsets have already been computed.
	*/
	this.next = function() {
		if (!this.firstcall && (!this.mtc || this.k === 0)) {
			// No more k-subset to generate
			return -1;
		}
		
		if (this.firstcall) {		
			// The first call has now been made
			this.firstcall = false;
		}
		else {
			// There is still a k-subset to generate
			if (this.m2 < this.n - this.h) {
				this.h = 0;
			}
			
			++this.h;
			this.m2 = this.a[this.k - this.h];
		}
				
		// Fill the k-subset array
		for (var j = 1; j <= this.h; ++j) {
			this.a[this.k + j - this.h - 1] = this.m2 + j;
		}

		// End logic
		this.mtc = (this.a[0] != this.endval);

		// Return either the array holding the k-subset, or a copy of this array, so that callers can alter it
		if (this.useArrayCopy) {
			return this.a.slice(0);
		}
		else {
			return this.a;
		}
	}
}

/**
* @function randomKSubsetsIterator_
*
* @summary Returns an infinite iterator to compute random k-subsets of a n-set.
*
* @description This function constructs an iterator to compute random k-subsets of the n-set {1,...,n}, 
* as lists of k distinct increasing integers in {1,...,n}, using the method D of the references.
*
* From the references, the random k-subsets are generated uniformly at random, in O(k) time 
* and O(1) additional space.
*
* @see J.S. Vitter. Faster Methods for Random Sampling. Communications of the ACM, 27, (July 1984), 703-718
* @see J.S. Vitter. An efficient algorithm for sequential random sampling. RR-0624, INRIA. 1987. <inria-00075929>
*
* @param {number} n the number of elements of the n-set {1,...,n} whose k-subsets are desired, a non-negative integer.
* @param {number} k a non-negative integer, with 1 <= k <= n.
* @param {boolean} useArrayCopy an optional boolean that can be set to false to re-use the same output array throughout
* all the computations (this improves the performances, but requires the caller to NOT alter the output array); defaults to true.
* @return {function} a function to be used as an iterator through its .next() method, computing random 
* k-subsets of the n-set {1,...,n}.
*
* @example
* var myIterator = new randomKSubsetsIterator_(6, 3);
* myIterator.next();
* // [1, 2, 5];
*/
function randomKSubsetsIterator_(n, k, useArrayCopy) {
	// Initialize n and k
	this.n = n;
	this.k = k;

	// Initialize the copy array variable
	this.useArrayCopy = useArrayCopy;

	// Initialize an array to hold the k-subsets
	this.a = typeof Uint32Array === 'function' ? new Uint32Array(k) : new Array(k);

	// Initializations for the method D
	// - N, the number of records that have not yet been processed
	// - nn, the number of records remaining to be selected
	// - idx_a, the array index used to write the selected records in the array a 
	// - selected_record, the value of the selected record 
	this.N;
	this.nn;
	this.idx_a;
	this.selected_record;
	
	
	/**
	* @function uniformrv
	*
	* @summary Returns a number generated uniformly at random in interval ]0,1[.
	*
	* @description This function computes a number uniformly at random in interval ]0,1[.
	*
	* @memberof randomKSubsetsIterator_
	* @return {number} a number generated uniformly at random in interval ]0,1[, a real number
	*
	*/
	function uniformrv() {
		// Generate a random number in the [0, 1[ interval
		var rnd = Math.random();
		
		// While the generated random number is (exactly) equal to 0,
		// reject it.
		while (rnd === 0) {
			rnd = Math.random();
		}
		
		// Return the generated random number, which is then 
		// generated uniformly at random in the ]0,1[ interval.
		return rnd;
	}

	/**
	* @function method_a
	*
	* @summary Returns a random k-subset of a n-set.
	*
	* @description This function computes a random k-subset of a n-set using the method A of the references,
	* and is used by the method D to avoid its worst-case behaviour, c.f. the references.
	*
	* @memberof randomKSubsetsIterator_
	*
	*/
	this.method_a = function() {
		// Initializations
		var top = this.N - this.nn;
		
		// General case
		while (this.nn >= 2) {
			// Step A1
			var V = uniformrv();
			
			// Step A2
			var S = 0;
			var quot = top / this.N;
			
			while (quot > V) {
				++S;
				--top;
				--this.N;
				quot = (quot * top) / this.N;
			}
			
			// Step A3
			// Skip over the next S records and select the following one for the sample
			this.selected_record += S + 1;
			this.a[this.idx_a++] = this.selected_record;
			
			--this.N;
			--this.nn;
		}
		
		// Special case nn = 1
		var S = Math.floor(this.N * uniformrv());
		if (S === this.N) { // the out of range value S = N must never be generated (which could be in case of roundoff errors)
			S = this.N - 1;
		}
		
		// Skip over the next S records and select the following one for the sample
		this.selected_record += S + 1;
		this.a[this.idx_a++] = this.selected_record;
	}

	/**
	* @function method_d
	*
	* @summary Returns a random k-subset of a n-set.
	*
	* @description This function computes a random k-subset of a n-set using the method D of the references.
	*
	* @memberof randomKSubsetsIterator_
	*
	*/
	this.method_d = function() {
		// Initializations
		var ninv = 1/this.nn;
		var Vprime = Math.pow(uniformrv(), ninv); // Math.exp(Math.log(a) * b) === Math.pow(a, b)
		var qu1 = -this.nn + 1 + this.N;
		var negalphainv = -13;
		var threshold = -negalphainv * this.nn;
		
		while (this.nn > 1 && threshold < this.N) {
			var nmin1inv = 1 / (-1 + this.nn);
			
			var X;
			var S;
			while (true) {
				// Step D2: Generate U and X
				while(true) {
					X = this.N 	* (-Vprime + 1);
					S = Math.floor(X);
					if (S < qu1) {
						break;
					}
					Vprime = Math.pow(uniformrv(), ninv); // Math.exp(Math.log(a) * b) === Math.pow(a, b)
				}
				var U = uniformrv();
				
				// Step D3: Accept ?
				var y1 = Math.pow(U * this.N / qu1, nmin1inv); // Math.exp(Math.log(a) * b) === Math.pow(a, b)
				Vprime = y1 * (-X/this.N + 1) * (qu1 / (-S + qu1));
				if (Vprime <= 1) {
					break;
				}
				
				// Step D4: Accept ?
				var y2 = 1;
				var top = -1 + this.N;
				
				var bottom;
				var limit;
				if (-1 + this.nn > S) {
					bottom = -this.nn + this.N;
					limit = -S + this.N;
				}
				else {
					bottom = -1 - S + this.N;
					limit = qu1;
				}
				
				for (var t = -1 + this.N; t >= limit; --t) {
					y2 = y2 * top / bottom;
					--top;
					--bottom;
				}
				
				if (this.N / (-X + this.N) >= y1 * Math.pow(y2, nmin1inv)) { // Math.exp(Math.log(a) * b) === Math.pow(a, b)
					// Accept
					Vprime = Math.pow(uniformrv(), nmin1inv); // Math.exp(Math.log(a) * b) === Math.pow(a, b)
					break;
				}
				Vprime = Math.pow(uniformrv(), ninv); // Math.exp(Math.log(a) * b) === Math.pow(a, b)
			}
			
			// Step D5: Select the (S + 1)st record
			// Skip over the next S records and select the following one for the sample
			this.selected_record += S + 1;
			this.a[this.idx_a++] = this.selected_record;
			
			// Prepare for the next iteration
			this.N = -S + (-1 + this.N);
			--this.nn;
			ninv = nmin1inv;
			qu1 = -S + qu1;
			threshold = threshold + negalphainv;
		}
		
		// If nn > 1 (i.e., threshold < N), use method A to finish the sampling,
		// otherwise, if nn == 1, deal with the special case nn = 1.
		if (this.nn > 1) {
			this.method_a();
		}
		else {
			var S = Math.floor(this.N * Vprime);
			if (S === this.N) { // the out of range value S = N must never be generated (which could be in case of roundoff errors)
				S = this.N - 1;
			}
		
			// Skip over the next S records and select the following one for the sample
			this.selected_record += S + 1;
			this.a[this.idx_a++] = this.selected_record;
		}		
	}
   
	/**
	* @function next
	*
	* @summary Returns a random k-subset of a n-set.
	*
	* @description This function computes a random k-subset of a n-set using the method D of the references.
	*
	* @memberof randomKSubsetsIterator_
	* @return {Array.<number>|Uint32Array} a random k-subset of the n-set {1,...,n}, a sorted array of k increasing strictly positive integers.
	*
	*/
	this.next = function() {
		// (Re) Initialization of the array holding the k-subset to 0 
		for (var i = 0; i < this.k; ++i) {
			this.a[i] = 0;
		}

		// Misc. internal variables required by the method D
		this.N = this.n;
		this.nn = this.k;
		this.idx_a = 0;
		this.selected_record = 0;
			
		// Call the method D, which will proceed with the effective
		// generation of the k-subset.
		this.method_d();
		
		// Return either the array holding the k-subset, or a copy of this array, so that callers can alter it
		if (this.useArrayCopy) {
			return this.a.slice(0);
		}
		else {
			return this.a;
		}
	}
}


/**
* @function subsetsIterator_
*
* @summary Returns an iterator to compute all the subsets of a n-set.
*
* @description This function constructs an iterator to compute all the subsets of the n-set {1,...,n}, 
* using the algorithm NEXSUB described in section 1 of the first reference.
*
* @see Nijenhuis, A., & Wilf, H. S. (1978). Combinatorial algorithms for computers and calculators. 2d ed. New York: Academic Press.
* @see <a href="*https://en.wikipedia.org/wiki/Power_set">Power set</a>
*
* @param {number} n the number of elements of the n-set {1,...,n} whose subsets are desired, a non-negative integer.
* @return {function} a function to be used as an iterator through its .next() method, computing all 
* the subsets of the n-set {1,...,n}, until they all have been exhausted, in which case
* -1 is returned.
*
* @example
* var myIterator = new subsetsIterator_(5);
* myIterator.next(); myIterator.next();
* // []; [1];
*/
function subsetsIterator_(n) {
	// Initialize n
	this.n = n;
	
	// Variables required for NEXSUB internal computations,
	// initialized so as to generate the first subset upon
	// the first call to .next() function.
	this.firstcall = true;
	this.mtc = false;
	this.iin = typeof Uint32Array === 'function' ? new Uint32Array(n) : new Array(n);
	this.ncard = 0;
	
	/**
	* @function next
	*
	* @summary Returns the next subset of a set.
	*
	* @description This function computes the next subset of the n-set {1,...,n}.
	*
	* The initial subset computed by the first call to this function is the empty subset {}, and each subsequent call to 
	* this function will result in a new subset until the final subset {1,...,n} is reached.
	*
	* A subsequent call to this function when the final subset {1,...,n} has been reached will result in
	* the function returning -1.
	*
	* @memberof subsetsIterator_
	* @return {Array.<number>|number} either an array containing a newly computed sorted subset
	* of the n-set {1,...,n} or -1 to indicate that all the subsets have already been computed.
	*/
	this.next = function() {
		// The output array containing the computed subset
		var nextSubset = [];
		
		if (!this.firstcall && !this.mtc) {
			// No more subset to generate
			return -1;
		}
		
		if (this.firstcall) {
			// The first call has now been made
			this.firstcall = false;
			
		    // Generation of the first subset, equals to {}
			for (var i = 0; i <= this.n - 1; ++i) {
				this.iin[i] = 0;
			}
			
			// The output array is already built in this case (empty)
			
			// Specific end logic
			this.mtc = true;
		}
		else {
			// There is still a subset to generate
			var j = 0;
			if (this.ncard % 2 != 0) {
				++j;
				while (this.iin[j - 1] == 0) {
					++j;
				}
			}
			this.iin[j] = 1 - this.iin[j];
			this.ncard = this.ncard + 2*this.iin[j] - 1;

			// Build the output array
			nextSubset = typeof Uint32Array === 'function' ? new Uint32Array(this.ncard) : new Array(this.ncard);
			var idx = 0;
			for (var i = 0; i <= this.n - 1; ++i) {
				if (this.iin[i] == 1) {
					nextSubset[idx++] = i + 1;
				}
			}
			
			// End logic
			this.mtc = (this.ncard != this.iin[this.n -1]);
		}

		// Return the computed array, not used anymore by this function
		return nextSubset;
	}
}


/**
* @function binomial_
*
* @summary Returns a binomial coefficient.
*
* @description This function computes the k-th binomial coefficient of order n, which is
* the coefficient of the x^k term in the polynomial expansion of the binomial power (1 + x)^n.
*
* This coefficient is also the number of ways to choose a subset of k elements,
* disregarding their order, from a set of n elements.
*
* The algorithm used is a multiplicative formula, c.f. the reference.
*
* @see <a href="*https://en.wikipedia.org/wiki/Binomial_coefficient">Binomial coefficient</a>
*
* @param {number} n a non-negative integer.
* @param {number} k a non-negative integer, with 0 <= k <= n.
* @return {number} the computed binomial coefficient.
*
* @example
* binomial_(7, 5);
* // 21
*/
function binomial_(n, k) {
    // Checks
    if (n < 0) {
        throw new Error('n must be a positive integer');
    }
    if (k < 0) {
        throw new Error('k must be a positive integer');
    }
    if (k > n) {
        throw new Error('k must be less than or equal to n');
    }
	  
	// Compute the binomial coefficient using the multiplicative formula of the reference.
	var val = 1;
    for (var i = 1; i <= k; ++i) {
        val *= (n + 1 - i);
		val /= i; // Note: separating the computation of val in two steps guarantees (unless compiler optimisations) that val is an integer.
    }
	
	// Return it
    return val;
}
     
/**
 * @file Misc. computational geometry functions.
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */



/**
* @function geometricCenter_
*
* @summary Compute the geometric center of a finite set of points belonging to R^n.
*
* @description This function returns the geometric center of m points x_1,...x_m 
* belonging to R^n, which is defined as the component-wise arithmetic mean of the m points.
*
* The geometric center of the m points x_1, ..., x_m is also the point y which 
* minimizes the sum of the squared Euclidean distances between itself and each point:
*
* y = argmin_x in R^n f(x) = sum ||y - x_i||_2^2, i = 1..m
*
* The geometric center of m points x_1,...x_m is also known as the centroid of the m points x_1,...x_m, 
* and as the center of mass of the m points x_1,...x_m.
*
* The algorithm implemented uses a two pass formula in order to reduce the computation error
* in the computation of the component wise mean, c.f. the second reference.
*
* @see <a href="https://en.wikipedia.org/wiki/Centroid">Centroid</a>
* @see <a href="http://dl.acm.org/citation.cfm?doid=365719.365958">Peter M. Neely (1966) Comparison of several algorithms for computation of means, standard deviations and correlation coefficients. Commun ACM 9(7):496–499.</a>
*
* @param {Array.<Matrix_>} x an array of m n by 1 matrices, corresponding to the coordinates 
* of the m points belonging to R^n.
* @return {Matrix_} the geometric center of the m points x_1,...x_m
*
* @example
* geometricCenter_([new Matrix([0,1,2]), new Matrix([1,2,3])]);
* // new Matrix([0.5,1.5,2.5]) 
*/
function geometricCenter_(x) {
	// TODO: Checks
	
	// Initialisations
	var m = x.length;
	var n = x[0].nbRows;

	// Instanciate the geometric center
	var y = Matrix_.zeros(n, 1);
	
	// For each coordinate i of the input points:
	// - Compute the mean over the m points of the coordinate i (first pass)
	// - Compute the correction factor (second pass), c.f. M_3 formula of the 
	// second reference
	// - Set the geometric center coordinate i to the corrected mean over the m points
	// of the coordinate i
	for (var i = 1; i <= n; ++i) {
		// Mean computation
		var sum_i = 0.0;
		for (var k = 0; k < m; ++k) {
			sum_i += x[k].getValue(i, 1);
		}
		var tmpMean_i = sum_i/m;

		// Correction factor computation
		var sumDiff_i = 0.0;
		for (var k = 0; k < m; ++k) {
			sumDiff_i += (x[k].getValue(i, 1) - tmpMean_i);
		}

		// Corrected mean computation
		y.setValue(i, 1,
		           (sum_i + sumDiff_i)/m);
	}
	
	// Return the computed geometric center
	return y;
}

/**
* @function geometricMedian_
*
* @summary Compute the geometric median of a finite set of points belonging to R^n.
*
* @description This function returns the geometric median of m points x_1,...x_m 
* belonging to R^n, which is defined as the point y which minimizes 
* the sum of the Euclidean distances between itself and each point:
*
* y = argmin_x in R^n f(x) = sum ||y - x_i||_2, i = 1..m
*
* The algorithm implemented uses a series of successive converging hyperbolic approximations of
* the euclidean norms appearing in the function f above, c.f. the second and third references,
* which allows to compute the geometric median using a standard first-order convex
* optimization algorithm.
*
* @see <a href="https://en.wikipedia.org/wiki/Geometric_median">Geometric median</a>
* @see <a href="http://dx.doi.org/10.1287/opre.23.3.581">Robert F. Love, James G. Morris, (1975) Technical Note—Solving Constrained Multi-Facility Location Problems Involving lp Distances Using Convex Programming. Operations Research 23(3):581-587.</a>
* @see <a href="https://dx.doi.org/10.4169%2Famer.math.monthly.121.02.095%23sthash.QTTb5Z6T.dpuf">Eric C. Chi and Kenneth Lange, A Look at the Generalized Heron Problem through the Lens of Majorization-Minimization. Am Math Mon. 2014 Feb; 121(2): 95–108.</a>
* @see <a href="https://arxiv.org/abs/1606.05225">Michael B. Cohen, Yin Tat Lee, Gary Miller, Jakub Pachocki, Aaron Sidford. Geometric Median in Nearly Linear Time. arXiv:1606.05225 [cs.DS]</a>
* @see <a href="https://doi.org/10.1007/BFb0083582">Ben-Tal A., Teboulle M. (1989) A smoothing technique for nondifferentiable optimization problems. In: Dolecki S. (eds) Optimization. Lecture Notes in Mathematics, vol 1405. Springer, Berlin, Heidelberg</a>
*
* @param {Array.<Matrix_>} x an array of m n by 1 matrices, corresponding to the coordinates 
* of the m points belonging to R^n.
* @return {Matrix_} the geometric median of the m points x_1,...x_m
*
* @example
* geometricMedian_([new Matrix([0,1,2]), new Matrix([1,2,3])]);
* // new Matrix([0.5, 1.5, 2.5]) 
*/
function geometricMedian_(x) {
    // Internal function to compute the function C_ph, 
	// approximation of the function f, c.f. formula 1 
	// of the second reference.
	function f_eps(y) {
		var sum = 0.0;

		for (var k = 0; k < m; ++k) {
			// Compute Math.SQRT(||y - x_k||_2^2 + eps^2), using a stable way to
			// compute the square root of two numbers squared.
			var y_m_x_k = Matrix_.xmy(y, x[k], tmp_vec_n);
			var y_m_x_k_two_norm = y_m_x_k.vectorNorm('two');
			
			sum += hypot_(y_m_x_k_two_norm, eps_f);
		}
		
		return sum;
	}
	
    // Internal function to compute the function grad(C_ph),
	// approximation of the gradient of the function f, c.f.
	// formula 1 of the second reference.
	function gradf_eps(y) {
		var res = Matrix_.zeros(n, 1);
		
		for (var k = 0; k < m; ++k) {
			// Compute (y - x_k)/Math.SQRT(||y - x_k||_2^2 + eps^2) and add it
			// to the currently computed gradient, using a stable way to
			// compute the square root of two numbers squared.
			var y_m_x_k = Matrix_.xmy(y, x[k], tmp_vec_n);
			var y_m_x_k_two_norm = y_m_x_k.vectorNorm('two');

			res = Matrix_.axpby(1, res, 1/hypot_(y_m_x_k_two_norm, eps_f), y_m_x_k, res);
		}
		
		return res;
	}

	
	// TODO: Checks
	
	
	// Initializations
	var m = x.length; // the number of points provided in input
	var n = x[0].nbRows; // the dimension of each point provided in input

	var tmp_vec_n = Matrix_.zeros(n, 1); // a temporary placeholder vector of dimension n
	
	
	// The geometric median will be computed using successive epsilon-approximations of
	// the euclidean norms appearing in its objective function, c.f. the second and the third
	// references.
	//
	// - Each epsilon-approximation of the objective function of the geometric median
	// problem is a smooth convex(/strictly convex) function, so that the associated
	// minimization problem can be solved using a standard first-order convex optimization
	// algorithm (below, FISTA-like).
	//
	// - As the epsilon parameter defining these epsilon-approximations converges to zero, 
	// the solution found by the convex optimization algorithm is proven to converge 
	// to the true geometric median, c.f. the third reference.
	
	// Compute a proper starting point for the optimization algorithm.
	//
	// Per lemma 18 of the fourth reference, the geometric center is a 
	// 2-approximation of the geometric median.
	var x0 = geometricCenter_(x);

	
	// Define additional functions used by the optimization algorithm
	// The projection on R^n
	var g = function(x) {
		return 0;
	}
		
	// The proximal function associated to g is the orthogonal
	// projection on R^n, i.e., the identity.
	var proxg = function(x, mu) {
		return x;
	}
		
			
	// Compute the minimum f_eps(x^*_eps) of the function f_eps on R^n, for successive decreasing values
	// of epsilon (which is actually squared in the computation of f_eps and gradf_eps).
	//
	// The following formula, from example 3.3 of the fifth reference, allows to 
	// bracket the quality of the approximation of the value f(x^*_eps) v.s. the true 
	// value f(x^*):
	//
	// 0 <= f(x^*_eps) - f(x^*) <= eps*m 
    // =>  | f(x^*_eps) - f(x^*) | <= eps*m 
	var eps_f = 1 / m;
	var sol = ccpsolveFISTA_(f_eps, gradf_eps, g, proxg, x0, {eps: 1e-4, maxIter: -1, maxLine: -1});

	eps_f = 1e-1 / m;
	sol = ccpsolveFISTA_(f_eps, gradf_eps, g, proxg, sol[0], {eps: 1e-4, maxIter: -1, maxLine: -1});

	eps_f = 1e-2 / m;
	sol = ccpsolveFISTA_(f_eps, gradf_eps, g, proxg, sol[0], {eps: 1e-4, maxIter: -1, maxLine: -1});


	// Return the computed optimal solution to the hyperbolic approximation of the 
	// geometric median.
	return sol[0];
}

/**
 * @file Misc. statistical functions.
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */




/**
* @function lineSegmentEuclidianProjection_
*
* @summary Returns the closest point on a line segment.
*
* @description This function computes the euclidean projection of a point
* x = (x_1,...,x_n) in R^n onto the line segment [a,b] of R^n.
*
* @see <a href="https://en.wikipedia.org/wiki/Line_segment">Line segment</a>
*
* @param {Array.<number>} x a point belonging to R^n, array of n real numbers.
* @param {Array.<number>} a a point belonging to R^n, array of n real numbers.
* @param {Array.<number>} b a point belonging to R^n, array of n real numbers.
* @return {Array.<number>} the computed closest point to x, array of n real numbers.
*
* @example
* lineSegmentEuclidianProjection_([1, 1, 1], [0, 0, 0], [2, 2, 2]);
* // [1, 1, 1]
*/
function lineSegmentEuclidianProjection_(x, a, b) {
	// Initializations
	var eps = 1e-8; // the numerical zero

	// The line segment [a, b] belongs to the linear subspace (a,b),
	// which can be parametrized by (a,b) = {a + t * (b-a), t in R}.
	//
	// The euclidean projection of x on this line satisfies P(x) = a + t^* (b-a),
	// with t^* = <x-a/b-a>/||b-a]]^2 in R.
	//
	// Then, t^* is truncated to belong to [0,1] so that P(x) belongs to [a,b],
	// and it can be verified that P(x) is indeed the euclidean projection of x
	// onto the line segment [a,b].
	var x = new Matrix_(x);
	
	var a = new Matrix_(a);
	var b = new Matrix_(b);
	
	// Checks on the dimensions
	if (a.nbRows != x.nbRows || b.nbRows != x.nbRows) {
		throw new Error('incompatible dimensions: ' + x.nbRows + ', ' + a.nbRows + ', ' + b.nbRows);
	}
	
	var u = Matrix_.xmy(b, a); // b-a
	var v = Matrix_.xmy(x, a); // x-a
	
	// If the points a and b are numerically identical, the projection on [a,b] is equal to a or b
	var u_two_norm = u.vectorNorm('two');
	if (u_two_norm <= eps) {
		return a.toArray();
	}
	
	// Otherwise, proceed with the formula above
	var t = Math.max(0, Math.min(1, Matrix_.vectorDotProduct(u, v) / (u_two_norm * u_two_norm)));
	var proj_x = Matrix_.axpby(1, a, t, u);
	
	// Return the computed projection
	return proj_x.toArray();
}

	
/**
* @function quantile_
*
* @summary Compute the quantile of a series of values.
*
* @description This function returns the p-quantile of a series of values [x_1,...,x_n].
*
* The internal algorithm used is based on the R-7 method of the reference, 
* which is the default for the R programming language and Excel.
*
* @see <a href="https://en.wikipedia.org/wiki/Quantile">Quantile</a>
*
* @param {Array.<number>} x an array of real numbers
* @param {number} p the order of the quantile to compute, a real number in the interval [0, 1]
* @param {boolean} inputArraySorted an optional boolean set to true to indicate that the series x is sorted in
* increasing order, and set to false otherwise; defaults to false
*
* @return {number} the p-th quantile of the series x
*
* @example
* quantile_([10, 20, 30, 40, 50], 0.25);
* // 20
*/
function quantile_(x, p, inputArraySorted) {
	// If applicable, sort the input array
	var xx = x;
	if (!inputArraySorted) {
		xx = x.slice(0).sort(function(a, b) { return a-b });
	}
	
	// Compute the index
    var i = p * (x.length - 1);
	var i0 = Math.floor(i);
	
	// Compute/linearly interpolate the p-th quantile
	var res;
    if (i0 == i) {
    	res = xx[i0];
    } else {
        res = xx[i0] + (xx[i0 + 1] - xx[i0]) * (i - i0);
    }
	
	// Return it
    return res;
}


/**
* @function boxRandomSampler_
*
* @summary Returns a function to compute random points inside an hyperrectangle of R^n.
*
* @description This function constructs a function to compute random points uniformly distributed 
* inside an hyperrectangle of R^n.
* 
* @param {number} n the dimension of the hyperrectangle of R^n, natural integer superior or equal to 1.
* @param {Array.<number>} l the optional lower bounds l_i of the hyperrectangle, an array of n real numbers l_i which must satisfy l_i <= u_i, i = 1..n; defaults to an array of zeros.
* @param {Array.<number>} u the optional upper bounds u_i of the hyperrectangle, an array of n real numbers u_i which must satisfy l_i <= u_i, i = 1..n; defaults to an array of ones.
* @param {boolean} reuseOutputArray an optional boolean that can be set to true to re-use the same output array throughout
* all the computations (this improves the performances, but requires the caller to NOT alter the output array); defaults to false.
*
* @return {function} a function to be used through its .sample() method, computing random  
* points inside an hyperrectangle of R^n.
*
* @example
* var mySampler = new boxRandomSampler_(3);
* mySampler.sample();
* // [1, 0, 0]
*/
function boxRandomSampler_(n, l, u, reuseOutputArray) {
	// Initializations
	this.n = n;
	this.x = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n); // the coordinates of a point being sampled
	this.reuseOutputArray = reuseOutputArray;
	
	// The lower bounds of the hyperrectangle
	this.l = l;
	if (!this.l) {
		this.l = typeof Float64Array === 'function' ? new Float64Array(this.n) : new Array(this.n); 
		for (var i = 0; i < this.n; ++i) {
			this.l[i] = 0; // default lower bounds values
		}
	}
	
	// The upper bounds of the hyperrectangle
	this.u = u;
	if (!this.u) {
		this.u = typeof Float64Array === 'function' ? new Float64Array(this.n) : new Array(this.n); 
		for (var i = 0; i < this.n; ++i) {
			this.u[i] = 1; // default upper bounds values
		}
	}

	// Emptiness check on the box.
	//
	// In case the box is empty, an exception is thrown, so that
	// the process is (violently) stopped here.
	for (var i = 0; i < this.n; ++i) {
		if (this.l[i] > this.u[i]) {
			throw new Error('empty box detected: lower bound strictly greater than upper bound');
		}
	}
		
	/**
	* @function sample
	*
	* @summary Returns a random point inside the hyperrectangle.
	*
	* @description This function computes a point choosen uniformly at random inside the hyperrectangle.
	*
	* @memberof boxRandomSampler_
	* @return {Array.<number>|Float64Array} an array of n real numbers corresponding to the coordinates of the computed point in R^n.
	*
	*/
	this.sample = function() {
		// For each coordinate x_i generate uniformly at random a point belonging to interval [l_i, u_i]
		for (var i = 0; i < this.n; ++i) {
			this.x[i] = Math.random() * (this.u[i] - this.l[i]) + this.l[i];
		}
		
		// Return either the point being sampled, or a copy of the point being sampled so that callers can alter it
		if (this.reuseOutputArray) {
			return this.x;
		}
		else {
			return this.x.slice(0);
		}
	}
}


 
/**
* @function boxGridSampler_
*
* @summary Returns a function to generate all the points of an hyperrectangle of R^n on a regular grid.
*
* @description This function constructs a function to generate all the points of the hyperrectangle [l_1, u_1] x ... x [l_n, u_n] of R^n
* on a regular grid of k_1 points, ..., k_n points, with possibly k_i = k, i=1..n.
* 
* The internal algorithm used is based on the dynamically nested loops generator described in the third reference.
*
* @see <a href="https://ideas.repec.org/p/cor/louvco/2003071.html">James Bergstra, Yoshua Bengio, Random Search for Hyper-Parameter Optimization, 
* Journal of Machine Learning Research 13 (2012) 281-305</a>
* @see <a href="https://en.wikipedia.org/wiki/Hyperrectangle">Hyperrectangle</a>
* @see <a href="https://www.codeproject.com/Tips/759707/Generating-dynamically-nested-loops">NATKIT7, Generating dynamically nested loops</a>
*
* @param {number} n the dimension of the hyperrectangle of R^n, natural integer superior or equal to 1.
* @param {number|Array.<number>} (number) k the common number of grid points to generate on all the intervals [l_i, u_i], i=1..n,
* a natural integer superior or equal to 1.
*                                (Array.<number>) k the number of grid points k_1=k[0],...,k_n=k[n-1] to generate on the 
* intervals [l_i, u_i], i=1..n, an array of natural integers superior or equal to 1.
* @param {Array.<number>} l the optional lower bounds l_i of the hyperrectangle, an array of n real numbers l_i which must satisfy l_i <= u_i, i = 1..n; defaults to an array of zeros.
* @param {Array.<number>} u the optional upper bounds u_i of the hyperrectangle, an array of n real numbers u_i which must satisfy l_i <= u_i, i = 1..n; defaults to an array of ones.
* @param {boolean} reuseOutputArray an optional boolean that can be set to true to re-use the same output array throughout
* all the computations (this improves the performances, but requires the caller to NOT alter the output array); defaults to false.
* @return {function} a function to be used through its .sample() method, computing all 
* the points of the hyperrectangle [l_1, u_1] x ... x [l_n, u_n] of R^n on a regular grid of k_1 points,...,k_n points.
*
* @example
* var mySampler = new boxGridSampler_(3, 11);
* mySampler.sample(); mySampler.sample(); ...; mySampler.sample();
* // [0, 0, 0]; [0, 0, 0.1]; [0, 0, 0.2]; ... ; -1
*/
function boxGridSampler_(n, k, l, u, reuseOutputArray) {
	// Initializations
	this.n = n;
	this.k = k;
	this.reuseOutputArray = reuseOutputArray;
	
	// The different loop variables in the dynamic nested loops generator
	this.arrs = typeof UInt32Array === 'function' ? new UInt32Array(this.n) : new Array(this.n);
	for (var i = 0; i < this.n; ++i) {
		this.arrs[i] = 0;
	}
	
	// The coordinates of the current point being sampled
	this.x = typeof Float64Array === 'function' ? new Float64Array(this.n) : new Array(this.n);
	
	// The lower bounds of the hyperrectangle
	this.l = l;
	if (!this.l) {
		this.l = typeof Float64Array === 'function' ? new Float64Array(this.n) : new Array(this.n); 
		for (var i = 0; i < this.n; ++i) {
			this.l[i] = 0; // default lower bounds values
		}
	}
	
	// The upper bounds of the hyperrectangle
	this.u = u;
	if (!this.u) {
		this.u = typeof Float64Array === 'function' ? new Float64Array(this.n) : new Array(this.n); 
		for (var i = 0; i < this.n; ++i) {
			this.u[i] = 1; // default upper bounds values
		}
	}
	
	// The number of grid points to generate and the grid size in each of the dimension of the hyperrectangle
	this.nbGridPoints = typeof UInt32Array === 'function' ? new UInt32Array(this.n) : new Array(this.n);
	this.gridSize = typeof Float64Array === 'function' ? new Float64Array(this.n) : new Array(this.n);
	for (var i = 0; i < this.n; ++i) {
		// The number of grid points to be computed on the interval [l_i, u_i] 
		// of the i-th dimension of the hyperrectangle
		var k_i;
		if (this.k[i]) {
			 k_i = this.k[i];
		}
		else {
			k_i = this.k;
		}
		this.nbGridPoints[i] = k_i;
		
		// The associated grid size
		if (k_i === 1) {
			this.gridSize[i] = 0;
		}
		else {
			this.gridSize[i] = (this.u[i] - this.l[i]) / (this.nbGridPoints[i] - 1);
		}
	}


	// Feasibility checks
	for (var i = 0; i < this.n; ++i) {
		var lowerBound = this.l[i];
		var upperBound = this.u[i];

		// Check on lower and upper bounds l_i and u_i
		if (lowerBound > upperBound) {
			throw new Error('infeasible problem detected: lower bound ' + lowerBound + ' strictly greater than upper bound ' + upperBound);
		}
		
		// Check on the grid size in case the lower bound is not equal to the upper bound
		else if (lowerBound < upperBound) {
			if (this.gridSize[i] <= 0) {
				throw new Error('incorrect number of grid points to generate on the interval [' + lowerBound + ', ' + upperBound + ']: ' + this.nbGridPoints[i]);
			}
		}
	}
	

	/**
	* @function sample
	*
	* @summary Returns a point of the hyperrectangle [l_1, u_1] x ... x [l_n, u_n] of R^n 
	* on a regular grid of k_1 points,...,k_n points.
	*
	* @description This function generates a point of the hyperrectangle [l_1, u_1] x ... x [l_n, u_n] of R^n
	* on a regular grid of k_1 points,...,k_n points.
	*
	* Each call to this function results in the generation of a new point, until exhaustion of all such points.
	*
	* @memberof boxGridSampler_
	* @return {Array.<number>|Float64Array|-1} an array of n real numbers corresponding to the
	* coordinates of the generated point in R^n, or -1 in case all such points have been generated.
	*/
	this.sample = function() {
		// In case there are no more points to generate, return immediately
		if (this.arrs[0] === this.nbGridPoints[0]) {
			return -1;
		}

		// Otherwise, generate a new point
		for (var i = 0; i < this.n; ++i) {
			this.x[i] = this.l[i] + this.arrs[i] * this.gridSize[i];
		}
		
		// Increment the dynamic nested loops variables for the next call to the .sample() method,
		// starting from the innermost loop.
		var change = true;
		var r = this.n - 1;
		while (change && r >= 0) {
			// Increment the innermost variable and check if spill overs
			++this.arrs[r];
            if (this.arrs[r] === this.nbGridPoints[r]) {        
                // If the first loop variable has spilled over, stop here, as it means 
				// there are no more points to generate.
				if (r === 0) {
					break;
				}
				
				// Otherwise, reinitialize the loop variable
				this.arrs[r] = 0;
				
                // Change the upper variable by one
                // We need to increment the immediate upper level loop by one
                change = true;
            }
            else {
                // Stop the increment here as the upper levels of the loop are unaffected
				change = false;
			}

            // Move to upper level of the loop
			--r;
        }

		// Return either the point being sampled, or a copy of the point being sampled so that callers can alter it
		if (this.reuseOutputArray) {
			return this.x;
		}
		else {
			return this.x.slice(0);
		}
	}
}


/**
* @function permutationEntropy_
*
* @summary Compute the permutation entropy of a series of values.
*
* @description This function returns the permutation entropy H of a series of values [x_1,...,x_n],
* which provides a simple and robust method to estimate the complexity of a time series,
* c.f. the first reference.
*
* In case there are several identical maximum values, TODO.
*
* The algorithm implemented internally is described in section 3 of the second reference.
*
* @see <a href="https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.88.174102">Bandt, C.; Pompe, B. Permutation Entropy: A Natural Complexity Measure for  Time Series. Phys. Rev. Lett. 88 (2002) 17, 174102</a>
* @see <a href="https://link.springer.com/article/10.1140/epjst/e2013-01862-7">Riedl, M.; Müller, A.; Wessel, N.: Practical considerations of permutation entropy. The European Physical Journal Special Topics 222 (2013) 2, 249–262</a>

* @param {Array.<number>} x an array of real numbers.
* @param {m} m a strictly positive natural integer representing the embedding dimension to consider, usually belonging to {3..7}, c.f. the first reference.
* @return {number} the permutation entropy of the time series x, using the embedding dimension m
*
* @example
* permutationEntropy_([6,9,11,12,8,13,5], 3);
* // 1.5219
*/
function permutationEntropy_(x, m) {
	// Initializations
	var n = x.length;
	var permutationsCounter = {};
	var nbPermutations = 0;

	// Core loop of the algorithm
	var idxStart = 0;
	var idxEnd = n - m + 1;	
	var xxPermutation = typeof UInt32Array === 'function' ? new UInt32Array(m) : new Array(m);
	for (var i = idxStart; i < idxEnd; ++i) {
		// Step 3 of the algorithm described in section 3 of the second reference:
		// - Extract the m values x_i...x_i+m-1 from the original array 
		var xx = x.slice(i, i + m);
		
		// - Calculate the ranks of the m values x_i...x_i+m-1, which are the indices 
		// of the values in ascending sorted order.
		for (var j = 0; j < m; ++j) {
			xxPermutation[j] = j + 1;
		}
		xxPermutation.sort(function(a, b) {
			return xx[a-1] - xx[b-1];
		});
		
		// Step 4 of the algorithm described in section 3 of the second reference:
		// increase the counter of the equal pattern by one.
		var permutationIndex = xxPermutation.toString();
		permutationsCounter[permutationIndex] = (permutationsCounter[permutationIndex] || 0) + 1;
		
		// Misc. updates
		++nbPermutations;
	}
	
	// Steps 6 and 7 of the algorithm described in section 3 of the second reference:
	// - Calculate the relative frequency of all the encountered permutations
	// - Select all the permutations whose frequency is > 0
	// - Calculate the permutation entropy using these selected permutations
	var pE = 0;
	for (var key in permutationsCounter) {
		if (permutationsCounter.hasOwnProperty(key)) {           
			var permutationCounter = permutationsCounter[key];
			var permutationFrequency = permutationCounter / nbPermutations;
			
			pE += permutationFrequency * Math.log(permutationFrequency)
		}
	}
	
	// Return the computed permutation entropy
	return -pE / Math.log(2);
}

	
/**
* @function max_
*
* @summary Compute the maximum of a serie of values.
*
* @description This function returns the maximum of a serie of values [x_1,...,x_n],
* as well as its index.
*
* In case there are several identical maximum values, the one corresponding to the
* lowest indice in the array x is returned.
*
* @param {Array.<number>} x an array of real numbers.
* @param {function} compareFunction an optional sort function that defines the sort order, using the standard prototype for JavaScript sort functions (c.f. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort).
* @return {Array.<number>} an array arr of two elements:
* arr[0], the maximum of the values of the array x, a real number
* arr[1], the index of the maximum of the values of the array x, a positive integer
*
* @example
* max_([2,4,4,1]);
* // [4, 1]
*/
function max_(x, compareFunction) {
	// Initialisations.
	var defaultCompareFct = function (a, b) {
		return a - b;
	};
	var compareFunction = compareFunction || defaultCompareFct;
	
	var n = x.length;
	
	// Core loop
	var maxValue = x[0];
	var maxValueIdx = 0;
	for (var i = 1; i < n; ++i) {
		//if (x[i] > maxValue) {
		if (compareFunction(x[i], maxValue) > 0) {
			maxValue = x[i];
			maxValueIdx = i;
		}
	}
	
	// Return the computed maximum value and its index
	return [maxValue, maxValueIdx];
}


/**
* @function median_
*
* @summary Compute the median of a serie of values.
*
* @description This function returns the median of a serie of values [x_1,...,x_n], 
* which is defined as:
* - When n is odd, the (n+1)/2-th smallest element of the p values x_1,...,x_n
* - When n is even, the n/2-th smallest element of the p values x_1,...,x_n
*
* The algorithm used internally is based on the O(n) SELECT algorithm of the reference.
*
* @see <a href="https://www.sciencedirect.com/science/article/pii/S0304397505004081">Krzysztof C. Kiwiel, On Floyd and Rivest's SELECT algorithm, Theoretical Computer Science, Volume 347, Issues 1–2, 2005, Pages 214-238</a>
* 
* @param {Array.<number>} x an array of real numbers.
* @param {function} compareFunction an optional sort function that defines the sort order, using the standard prototype for JavaScript sort functions (c.f. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort).
* @return {number} the median of the values of the array x.
*
* @example
* median_([2,4,1]);
* // 2
*
* median_([2,4,1,3]);
* // 2.5
*/
function median_(x, compareFunction) {
	// Initialisations.
	var n = x.length;
	var xx = x.slice(); // to avoid altering the array x
	
	// Compute the smallest |-n/2-| element of the array, which corresponds to the median
	return select_(xx, Math.ceil(n/2), compareFunction);
}


/**
* @function select_
*
* @summary Compute the smallest k element of a series of values.
*
* @description This function permutes a series of values x = [x_1,...,x_n] so that:
* - The smallest k elements of x are x[i], i=0..k-1 (in an arbitrary order)
* - The k-th smallest element of x is x[k-1]
* - The n-k-th largest elements of x are x[i], i=k..n-1 (in an arbitrary order)
*
* The algorithm used internally is the O(n) algorithm of the reference.
*
* This code is a port to JavaScript by Roman Rubsamen of the Fortran 77 code
* written by K.C. Kiwiel, version of the 8 March 2006, kiwiel@ibspan.waw.pl.,
* except for the indices computation part which is new.
*
* The Fortran 77 version was a Fortran code for the Algol 68 procedure from
* the second reference, including some modifications suggested in the third 
* reference.
*
* @see <a href="https://www.sciencedirect.com/science/article/pii/S0304397505004081">Krzysztof C. Kiwiel, On Floyd and Rivest's SELECT algorithm, Theoretical Computer Science, Volume 347, Issues 1–2, 2005, Pages 214-238</a>
* @see <a href="https://dl.acm.org/citation.cfm?doid=360680.360694">R.W. Floyd and R.L. Rivest: "Algorithm 489: The Algorithm SELECT---for Finding the $i$th Smallest of $n$ Elements", Comm. ACM 18, 3 (1975) 173</a>
* @see <a href="https://dl.acm.org/citation.cfm?id=355704">T. Brown: "Remark on Algorithm 489", ACM Trans. Math. Software 3, 2 (1976), 301-304.</a>
* 
* @param {Array.<number>} x an array of real numbers.
* @param {number} k a strictly positive natural integer specifying which k-th smallest element of x is to be selected.
* @param {function} compareFunction an optional sort function that defines the sort order, using the standard prototype for JavaScript sort functions (c.f. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort).
* @return {number} the k-th smallest element of x
*
* @example
* select_([2,4,1], 2);
* // 2
* // [2,4,1] is permuted into [1,2,4]
*/
function select_(x, k, compareFunction) {
	// ------
	
	// Initializations
	var defaultCompareFct = function (a, b) {
		return a - b;
	};
	var compareFunction = compareFunction || defaultCompareFct;
	
	var n = x.length;

	var cutoff = 600;
	var cs = 0.5; // Brown's version: cs = 0.5
	var csd = 0.5; // Brown's version: cs = 0.1

	// The arrays stack_1 and stack_2 of nstack elements permits up to
	// nstack levels of recursion.
    // For standard parameters cs <= 1 and cutoff >= 600,
    // nstack = 5 suffices for n up to 2**31-1 (maximum integer*4).	
	var nstack = 10;
	var stack_1 = typeof UInt32Array === 'function' ? new UInt32Array(nstack) : new Array(nstack);
	var stack_2 = typeof UInt32Array === 'function' ? new UInt32Array(nstack) : new Array(nstack);
	var jstack = 0; // number of elements in the stacks stack_1 and stack_2
	
	var l = 0;
    var r = n - 1; // -1 because Fortran convention is to start the arrays at index 1
    var k = k - 1; // same as above
	
	
	// ------
	
	// entry to SELECT( x, n, l, r, k)
	// SELECT will rearrange the values of the array segment x[l:r] so
	// that x(k) (for some given k; 0 <= k <= r-1) will contain the
	// (k-l+1)-th smallest value, l <= i <= k will imply x(i) <= x(k),
	// and k <= i <= r will imply x(k) <= x(i).
	while (true) {
		// Note: Rules of FORTRAN 77 rounding of real numbers to integers can
		// be found here -> https://gcc.gnu.org/onlinedocs/gfortran/INT.html
		
		// The additional test below prevents stack overflow.
		if (r - l > cutoff &&  jstack < nstack) {
			// Use SELECT recursively on a sample of size s to get an
			// estimate for the (k-l+1)-th smallest element into x(k),
			// biased slightly so that the (k-l+1)-th element is
			// expected to lie in the smaller set after partitioning.
			var m = r - l + 1;
			var i = k - l + 1;
			var dm = m;
			
			var z = Math.log(dm);
			var s = Math.floor(cs * Math.exp(2*z/3) + 0.5); // from the code, s is a positive integer
			var sign = i >= dm/2 ? 1 : - 1 // emulates sign(1,i-dm/2)
			var sd = csd * Math.sqrt(z*s*(1-s/dm)) * sign + 0.5; // sd is supposed to be an integer, and can be positive or negative, so, emulates FORTRAN rounding
			if (-1 < sd && sd < 1) {
				sd = 0;
			}
			else if (sd >= 1) {
				sd = Math.floor(sd);
			}
			else {
				sd = Math.ceil(sd);
			}
			// Brown's modification: sd = csd*Math.sqrt(z*s*(1-s/dm))*(2*i/dm-1)+0.5;
			if (i == m/2) {
				sd = 0;
			}
			
			// Push the current l and r on the stack.
			stack_1[jstack] = l;
			stack_2[jstack] = r;
			jstack++;
			
			// Find new l and r for the next recursion.
			var comp = k - i*(s/dm) + sd;
			if (l < comp) {
				l = Math.floor(comp + 0.5); // l is a positive integer
			}
			if (r > comp + s) {
				r = Math.floor(comp + s + 0.5); // r is a positive integer
			}
			// call SELECT( x, n, l, r, k)
		}
		else {
			if (l >= r) {
				// Exit if the stack is empty.
				if (jstack == 0) {
					return x[k];
				}
				
				// Pop l and r from the stack.
				--jstack;
				l = stack_1[jstack];
				r = stack_2[jstack];
				
				// Continue as if after a return from a recursive call.
			}
			
			// Partition x[l:r] about the pivot v := x(k).
			var v = x[k];
			
			// Initialize pointers for partitioning.
			i = l;
			j = r;
			
			// Swap x(l) and x(k).
			x[k] = x[l];
			x[l] = v;

			//if (v < x[r]) {
			if (compareFunction(v, x[r]) < 0) {
				// Swap x(l) and x(r).
				x[l] = x[r];
				x[r] = v;
			}
			
			while (i < j) {
	            //Swap x(i) and x(j).
				var tmp = x[j];
	            x[j] = x[i];
	            x[i] = tmp;
				
				++i;
				--j;
				
				// Scan up to find element >= v.
	            //while (x[i] < v) {
				while (compareFunction(x[i], v) < 0) {
					++i;
				}
				
				// Scan down to find element <= v.
				//while (x[j] > v) {
				while (compareFunction(x[j], v) > 0) {
					--j;
				}
			}
			
			//if (x[l] == v) {
			if (compareFunction(x[l], v) == 0) {
				// Swap x(l) and x(j).
				var tmp = x[l];
				x[l] = x[j];
				x[j] = tmp;
			} 
			else {
				++j;
				
				// Swap x(j) and x(r).
				var tmp = x[j];
				x[j] = x[r];
				x[r] = tmp;
			}
			
			// Now adjust l, r so that they surround the subset containing
			// the (k-l+1)-th smallest element.
			if (j <= k) {
				l = j + 1;
			}
			if (k <= j) {
				r = j - 1;
			}
		}
	}
}
 
  /**
* @function nextUp_
*
* @summary Returns the next double-precision number larger than a number.
*
* @description This function computes the next double-precision number
* larger than a number x.
*
* This function has been copied/pasted from https://gist.github.com/Yaffle/4654250,
* with no adaptation.
*
* @param {number} x a real number.
* @return {number} the next double-precision number larger than x, a real number.
*
* @example
* nextUp_(1.0000000000000002);
* // 
*/
function nextUp_(x) {
	var EPSILON = Math.pow(2, -52);
	var MAX_VALUE = (2 - EPSILON) * Math.pow(2, 1023);
	var MIN_VALUE = Math.pow(2, -1022);

	if (x !== x) {
	  return x;
	}
	if (x === -1 / 0) {
	  return -MAX_VALUE;
	}
	if (x === +1 / 0) {
	  return +1 / 0;
	}
	if (x === +MAX_VALUE) {
	  return +1 / 0;
	}
	var y = x * (x < 0 ? 1 - EPSILON / 2 : 1 + EPSILON);
	if (y === x) {
	  y = MIN_VALUE * EPSILON > 0 ? x + MIN_VALUE * EPSILON : x + MIN_VALUE;
	}
	if (y === +1 / 0) {
	  y = +MAX_VALUE;
	}
	var b = x + (y - x) / 2;
	if (x < b && b < y) {
	  y = b;
	}
	var c = (y + x) / 2;
	if (x < c && c < y) {
	  y = c;
	}
	return y === 0 ? -0 : y;
}


 /**
* @function hypot_
*
* @summary Returns the square root of the sum of the squares of two numbers (i.e., the hypotenuse).
*
* @description This function computes the value of sqrt(abs(x)^2 + abs(y)^2) in a way
* to avoid as much as possible underflow and overflow.
*
* @see <a href="https://en.wikipedia.org/wiki/Hypot#Implementation">Hypot</a>
*
* @param {number} x a real number.
* @param {number} y a real number.
* @return {number} the value of sqrt(abs(x)^2 + abs(y)^2), a real number.
*
* @example
* hypot_(3, 4);
* // 5
*/
function hypot_(x, y) {
    // Initialization
	var r = 0;
    
	// Main algorithm
	var absX = Math.abs(x);
	var absY = Math.abs(y);
	if (absX > absY) {
	   r = y/x;
	   r = absX * Math.sqrt(1 + r*r);
    } 
	else if (y != 0) {
	   r = x/y;
	   r = absY * Math.sqrt(1 + r*r);
    }
	else {
	   r = 0;
    }
    
	// Return the computed value
	return r;
}

 
/**
* @function rank_
*
* @summary Returns the rank of each value in a series of values.
*
* @description This function computes the rank of each value in a series of values, which is computed 
* by first sorting the series of values, either by ascending or descending order, and then by computing 
* the position of each value in the sorted series.
*
* Duplicate values in the series of values all have the same rank, defined as the bottom rank of these duplicate values.
*
* This function mimics the Excel function RANK.EQ.
*
* @param {Array.<number>} x an array of real numbers.
* @param {number} order an integer equals to 0 to sort the series of values in descending order, or equals to 1 to sort the series of values in ascending order.
* @return {Array.<number>} an array of real numbers of the same size as x, containing the rank of each value of x.
*
* @example
* rank_([12, 13, 15, 10, 12], 1);
* // [2, 4, 5, 1, 2]
*/
function rank_(x, order) {
	// Transform the input array into an array with indexes
	var xWithIndexes = new Array(x.length);
	for (var i = 0; i < x.length; ++i) {
		xWithIndexes[i] = [x[i], i];
	}
	
	// Sort the transformed array
	if (order == 0) {
		xWithIndexes.sort(function(a, b) {
			return a[0] > b[0] ? -1 : 1;
		}); 
	}
	else if (order == 1) {
		xWithIndexes.sort(function(a, b) {
			return a[0] < b[0] ? -1 : 1;
		}); 
	}
	
	// Compute the ranks of the values, setting an equal rank for all identical values
	// and skipping the next ranks values
	var xRanks = new Array(x.length);
	xRanks[xWithIndexes[0][1]] = 1; // first rank is always 1
	for (var i = 1; i < x.length; ++i) {
	    if (xWithIndexes[i][0] == xWithIndexes[i-1][0]) {
	  	  xRanks[xWithIndexes[i][1]] = xRanks[xWithIndexes[i-1][1]];
	    }
	    else {
		  xRanks[xWithIndexes[i][1]] = i + 1;
	    }
	}
	
	// Returnt the computed ranks
	return xRanks;
}


/**
* @function ftca_
*
* @summary Compute a clustering representation of a universe of elements using the Fast Threshold Clustering Algorithm (FTCA).
*
* @description This function returns the clustering representation of a universe of n elements based on their correlation
* and a correlation threshold, as computed by the FTCA algorithm of David Varadi described in the reference, initially created
* to deal with financial assets.
*
* This algorithm has many desirable properties that traditional clustering algorithms do not:
* 1) it produces fairly stable clusters
* 2) it is fast and deterministic 
* 3) it is easy to understand. 
*
* By default, David Varadi used a correlation threshold of 0.5 (approximately the level of statistical significance) to separate similar from dissimilar elements (assets).
* The choice of the threshold will change the number and stability of the clusters, with higher thresholds showing more clusters and a greater change in membership than lower thresholds. 
*
* To be noted that the FTCA works similar to the Minimum Correlation Algorithm from the same author in that it uses the average correlation of each element (asset)
* to all other elements (asset)s as a means of determining how closely or distantly related an element (asset) is to the universe of elements (assets) chosen.
*
* @see <a href="https://cssanalytics.wordpress.com/2013/11/26/fast-threshold-clustering-algorithm-ftca/">Fast Threshold Clustering Algorithm (FTCA)</a>
* 
* @param {Array.<Array.<number>>} correlationMatrix the correlation matrix (rho_ij),i,j=1..n, an array arr of n arrays of n real numbers 
* satisfying arr[i-1][j-1] = rho_ij, i,j=1..n, where n is a strictly positive natural integer.
* @param {number} threshold the correlation threshold to use in the FTCA algorithm, a real number typically belonging to interval [-1, 1].
* @return {Array.<Array.<number>>} the list of clusters as computed by the FTCA algorithm, array of m arrays of strictly positive integers representing the indexes of the elements in the considered universe, where m is the number of clusters, with the m arrays forming a partition of the set [1..n].
*
* @example
* ftca_([[1, 0], [0,1]]), 0.5);
*  // [[2],[1]]
*/
function ftca_(correlationMatrix, threshold) {
	// Decode the optional threshold
	var threshold = threshold;
	if (threshold === undefined) {
		threshold = 0.5;
	}
	
	// Convert the correlation matrix to matrix format
	var correlationMatrix = new Matrix_(correlationMatrix);
	
	// The list of output clusters, to be populated
	var clusters = [];

	// The list of elements indexes not assigned to any cluster, initialized with all elements indexes (initially, no clusters are existing)
	var nbElements = correlationMatrix.nbRows;
	var unassignedElementsIdx = new Array(nbElements);
	for (var i = 0; i < unassignedElementsIdx.length; ++i) {
		unassignedElementsIdx[i] = i + 1;
	}

	// While there are elements that have not been assigned to a cluster
	while (unassignedElementsIdx.length != 0) {
		// If only one element remaining then
		if (unassignedElementsIdx.length === 1) {
			// Add a new cluster
			// Only member is the remaining element, set as not unassigned anymore
			var newCluster = [unassignedElementsIdx[0]];
			unassignedElementsIdx[0] = null;
			
			// Effectively add the new cluster into the list of clusters
			clusters.push(newCluster);
		}	
		else {
			// Get the (sub)correlation matix of the unassigned elements
			var subCorrMat = correlationMatrix.submatrix(unassignedElementsIdx, unassignedElementsIdx);
			
			// Compute the average correlation of each unassigned element to all the other unassigned elements
			// Computation is done for each row
			var subCorrMatRows = subCorrMat.toRowArray(function(i, j, val) {
				return i != j;
			});
			var avgCorrelation = new Array(unassignedElementsIdx);
			for (var i = 0; i < unassignedElementsIdx.length; ++i) {
				avgCorrelation[i] = mean_(subCorrMatRows[i]);
			}
				
			// Find the element with the Highest Average Correlation (HC) to all elements not yet been assigned to a Cluster
			// Find the element with the Lowest Average Correlation (LC) to all elements not yet assigned to a Cluster
			// Note: When only 2 elements are remaining, HC will be equal to LC
			var hc = 0;
			var hcIdx = -1;
			var highestAvgCorrelation = -1;
			var lc = 0;
			var lcIdx = -1;
			var lowestAvgCorrelation = 1;		
			for (var i = 0; i < unassignedElementsIdx.length; ++i) {
				if (avgCorrelation[i] >= highestAvgCorrelation) {
					hc = unassignedElementsIdx[i];
					hcIdx = i;
					highestAvgCorrelation = avgCorrelation[i];
				}
				if (avgCorrelation[i] <= lowestAvgCorrelation) {
					lc = unassignedElementsIdx[i];
					lcIdx = i;
					lowestAvgCorrelation = avgCorrelation[i];
				}
			}
			
			// If Correlation between HC and LC > Threshold
			if (correlationMatrix.getValueAt(hc, lc) > threshold) {
				// Add a new Cluster made of HC and LC and set these two elements as not unassigned anymore
				// (Unless HC == LC, which can happen, for instance when there are only two elements remaining)
				var newClusterHcLc = (hc === lc ? [hc] : [hc, lc]);
				unassignedElementsIdx[hcIdx] = null;
				unassignedElementsIdx[lcIdx] = null;
				
				// Add to Cluster all other elements that have yet been assigned to a Cluster and have an Average Correlation to HC and LC > Threshold
				// Note: In Systematic Investor R code, all remaining elements are put inthe HcLc cluster, disregarding the condition on the correlation above.
				for (var i = 0; i < unassignedElementsIdx.length; ++i) {
					if (unassignedElementsIdx[i] !== null) { // Skip assigned elements (HC and LC)
						var avgHcLcAssetCorrelation = (correlationMatrix.getValueAt(unassignedElementsIdx[i], hc) + correlationMatrix.getValueAt(unassignedElementsIdx[i], lc)) / 2;
						if (avgHcLcAssetCorrelation  > threshold) {
							newClusterHcLc.push(unassignedElementsIdx[i]);
							
							// Set the element as not unassigned anymore
							unassignedElementsIdx[i] = null;
						}
					}
				}
			   
				// Effectively add the new cluster into the list of clusters				
				clusters.push(newClusterHcLc);
			}
			// Else
			else {
				// Add a Cluster made of HC and set this element as not unassigned anymore
				var newClusterHc = [hc];
				unassignedElementsIdx[hcIdx] = null;
				
				// Add to Cluster all other assets that have yet been assigned to a Cluster and have a Correlation to HC > Threshold
				for (var i = 0; i < unassignedElementsIdx.length; ++i) {
					if (unassignedElementsIdx[i] !== null) { // Skip assigned assets (HC)
						if (correlationMatrix.getValueAt(unassignedElementsIdx[i], hc) > threshold) {
							newClusterHc.push(unassignedElementsIdx[i]);
							
							// Set the element as not unassigned anymore
							unassignedElementsIdx[i] = null;
						}
					}
				}
				
				// Effectively add the new cluster into the list of clusters				
				clusters.push(newClusterHc);

				// Add a Cluster made of LC and set this element as not unassigned anymore
				// (Unless HC == LC, which can happen, for instance when there are only two elements remaining)
				if (hc !== lc) {
					// Note: At this stage, the LC element cannot have been assigned to the Hc cluster above if LC <> HC, since
					// otherwise, it would mean corr(lc, hc) > threshold, which is incompatible with the "else" branch in which
					// the code currently is; Lc cluster is thus always non empty.
					var newClusterLc = [lc];
					unassignedElementsIdx[lcIdx] = null;
					
					// Add to Cluster all other assets that have yet been assigned to a Cluster and have Correlation to LC > Threshold
					for (var i = 0; i < unassignedElementsIdx.length; ++i) {
						if (unassignedElementsIdx[i] !== null) { // Skip assigned assets (HC with its correlated assets, and LC)
							if (correlationMatrix.getValueAt(unassignedElementsIdx[i], lc) > threshold) {
								newClusterLc.push(unassignedElementsIdx[i]);
								
								// Set the element as not unassigned anymore
								unassignedElementsIdx[i] = null;
							}
						}
					}

					// Effectively add the new cluster into the list of clusters				
					clusters.push(newClusterLc);
				}
				
				// Note: In Systematic Investor R code, it is possible for an element to belong to the two clusters Hc and Lc, in which case Hc is the final cluster,
				// which is conform to the description of the reference.
			}
		}
		
		// Effectively remove the assigned elements indexes (now pointing to null)  from the list of unassigned elements
		var newUnassignedElementsIdx = [];
		for (var i = 0; i < unassignedElementsIdx.length; ++i) {
			if (unassignedElementsIdx[i] !== null) {
				newUnassignedElementsIdx.push(unassignedElementsIdx[i]);
			}
		}
		unassignedElementsIdx = newUnassignedElementsIdx;
	}

	// Return the computed list of clusters
	return clusters;
}



/**
* @function mean_
*
* @summary Compute the arithmetic mean of a serie of values.
*
* @description This function returns the arithmetic mean of a serie of values [x_1,...,x_p], 
* which is defined as the sum of the p values x_1,...,x_p, divided by p.
*
* The algorithm implemented uses a two pass formula in order to reduce the computation error, c.f. the reference.
*
* @see <a href="http://dl.acm.org/citation.cfm?doid=365719.365958">Peter M. Neely (1966) Comparison of several algorithms for computation of means, standard deviations and correlation coefficients. Commun ACM 9(7):496–499.</a>
* 
* @param {Array.<number>} x an array of real numbers.
* @return {number} the arithmetic mean of the values of the array x.
*
* @example
* mean_([2,4]); 
* // 3
*/
function mean_(x) {
	// Initialisations
	var nn = x.length;

	// Compute the mean of the values of the input numeric array (first pass)
	var tmpMean = 0.0;
	var sum = 0.0;
	for (var i=0; i<nn; ++i) {
		sum += x[i];
	}
	tmpMean = sum/nn;

	// Compute the correction factor (second pass)
	// C.f. M_3 formula of the reference
	var sumDiff = 0.0;
	for (var i=0; i<nn; ++i) {
		sumDiff += (x[i] - tmpMean);
	}

	// Return the corrected mean
	return (sum + sumDiff)/nn;
}


/**
* @function variance_
*
* @summary Compute the variance of a serie of values.
*
* @description This function returns the variance of a serie of values [x_1,...,x_p], 
* which is defined as the arithmetic mean of the p values (x_1-m)^2,...,(x_p-m)^2, where m is the arithmetic mean
* of the p values x_1,...,x_p.
*
* The algorithm implemented uses a two pass formula in order to reduce the computation error, c.f. the reference.
*
* @see <a href="http://dl.acm.org/citation.cfm?doid=365719.365958">Peter M. Neely (1966) Comparison of several algorithms for computation of means, standard deviations and correlation coefficients. Commun ACM 9(7):496–499.</a>
*
* @param {Array.<number>} x an array of real numbers.
* @return {number} the variance of the values of the array x.
*
* @example
* variance_([4, 7, 13, 16]); 
* // 22.5
*/
function variance_(x) {
	// Initialisations
	var nn = x.length;

	// Compute the mean of the input numeric array (first pass)
	var meanX = mean_(x);

	// Compute the squared deviations plus the correction factor (second pass)
	// C.f. S_4 formula of the reference
	var sumSquareDiff = 0.0;
	var sumDiff = 0.0;
	for (var i=0; i<nn; ++i) {
		var diff = (x[i] - meanX);
		sumSquareDiff += diff * diff;
		sumDiff += diff;
	}

	// Compute the corrected sum of squares of the deviations from the mean
	var S = sumSquareDiff - ((sumDiff * sumDiff) / nn);

	// Return the corrected variance
	return S/nn;
}


/**
* @function sampleVariance_
*
* @summary Compute the sample variance of a serie of values.
*
* @description This function returns the sample variance of a serie of values [x_1,...,x_p], 
* which is defined as the variance of the p values x_1,...,x_p multiplied by p/(p-1).
*
* The algorithm implemented uses a two pass formula in order to reduce the computation error, c.f. the function variance_.
*
* @param {Array.<number>} x an array of real numbers.
* @return {number} the variance of the values of the array x.
*
* @example
* sampleVariance_([4, 7, 13, 16]); 
* // 30
*/
function sampleVariance_(x) {
	var nn = x.length;
	return variance_(x) * nn/(nn - 1);
}


/**
* @function stddev_
*
* @description Compute the standard deviation of a serie of values.
*
* @description This function returns the standard deviation of a serie of values [x_1,...,x_p], 
* which is defined as the square root of the variance of the p values x_1,...,x_p.
*
* The algorithm implemented uses a two pass formula in order to reduce the computation error, c.f. the function variance_.
*
* @see <a href="https://en.wikipedia.org/wiki/Standard_deviation">https://en.wikipedia.org/wiki/Standard_deviation</a>
*
* @param {Array.<number>} x an array of real numbers.
* @return {number} the standard deviation of the values of the array x.
*
* @example
* stddev_([1, 2, 3, 4]); 
* // ~1.12
*/
function stddev_(x) {
	return Math.sqrt(variance_(x));
}


/**
* @function sampleStddev_
*
* @description Compute the sample standard deviation of a series of values.
*
* @description This function returns the sample standard deviation of a series of values [x_1,...,x_p], 
* which is defined as the square root of the sample variance of the p values x_1,...,x_p.
*
* The algorithm implemented uses a two pass formula in order to reduce the computation error, c.f. the function sampleVariance_.
*
* @param {Array.<number>} x an array of real numbers.
* @return {number} the standard deviation of the values of the array x.
*
* @example
* sampleStddev_([1, 2, 3, 4]); 
* // ~1.29
*/
function sampleStddev_(x) {
	return Math.sqrt(sampleVariance_(x));
}



/**
* @function normcdf_
*
* @summary Compute the standard normal cumulative distribution function.
*
* @description This function returns an approximation of the standard normal cumulative distribution function, i.e.
* given x a real number, it returns an approximation to p = Pr{Z <= x} where Z is a
* random variable following a standard normal distribution law.
*
* This function is also called Phi in the statistical literature.
*
* The algorithm uses a Taylor expansion around 0 of a well chosen function of Phi,
* and has a theoretical absolute error of less than 8e−16.
*
* @author George Marsaglia
*
* @see <a href="https://www.jstatsoft.org/article/view/v011i04/v11i04.pdf"> G. Marsaglia. Evaluating the normal distribution. Journal of Statistical Software, 11(4):1–11, 2004.</a>
* 
* @param {number} x a real number.
* @return {number} an approximation to the p value satisfying p = Pr{Z <= x} where Z is a random variable following a standard normal distribution law.
*
* @example
* normcdf_(0);
* // 0.5
*/
function normcdf_(x) {
	// Initialisations
	var sum = x;
	var term = 0;
	var next_term = x;
	var power = x*x;
	var i = 1;

	// Limit cases, as described in the reference.
	if (x < -8.0) {
		return 0.0;
	}
	else if (x > 8.0) {
		return 1.0;
	}
	
	// The main loop corresponds to the computation of the Taylor series of the function B around 0, 
	// c.f. page 5 of the reference.
	//
	// In a nutshell, the Taylor expansion is computed term by term until the addition of a new term 
	// stops to produce a change (from a numerical accuracy perspective).
	while (sum != term) {
		sum = (term = sum) + (next_term *= power/(i += 2));
	}

	// The formula linking Phi and the Taylor expansion above if Phi = 1/2 + normal density * B, c.f. page 5 of the reference.
	return 0.5 + sum * Math.exp(-0.5 * power - 0.91893853320467274178)
}


/**
* @function normrnd_
*
* @summary Computes a random number from the normal distribution.
*
* @description This function generates a random number from the normal distribution
* with mean parameter mu and standard deviation parameter sigma.
*
* The algorithm used is based on the inverse method.
*
* @param {number} mu mean parameter of the random number to generate, real number; defaults to 0.
* @param {number} sigma standard deviation parameter of the random number to generate, real number; defaults to 1.
* @return {number} the computed random number.
*
* @example
* normrnd_(0,1);
* // 0.5377
*/
function normrnd_(mu, sigma) {
	// Initialize default parameter
	if (!mu) {
		mu = 0;
	}
	if (!sigma) {
		sigma = 1;
	}
	
	// Generate a random variable from N(0,1), using the inverse method
	var u = Math.random(); // u ~ U[0,1[
	while (u === 0.0) {
		u = Math.random();
	} // u ~ U]0,1[
	var r = norminv_(u); // r ~ N(0,1)
	
	// Convert the random variable from N(0,1) to N(mu, sigma)
	return mu + sigma*r;
}


/**
* @function pnormrnd_
*
* @summary Computes a random number from the normal distribution with
* positive support.
*
* @description This function generates a random number from the normal distribution
* with positive support and with mean parameter mu and standard deviation parameter sigma.
*
* The algorithm used is described in the reference.
*
* The code below has been adapted from the initial Matlab code rpnorm.m done by Vincent Mazet,
* vincent.mazet@unistra.fr, 06/2005, 10/2010.
*
* @see <a href="http://miv.u-strasbg.fr/mazet/publis/mazet05_ssp.pdf">V. Mazet, D. Brie, J. Idier. Simulation of Positive Normal Variables using several Proposal Distributions. IEEE Workshop Statistical Signal Processing 2005</a>
* 
* @param {number} mu mean parameter of the random number to generate as if the distribution was not truncated, real number; defaults to 0.
* @param {number} sigma standard deviation parameter of the random number to generate as if the distribution was not truncated, real number; defaults to 1.
* @return {number} the computed random number.
*
* @example
* pnormrnd_(0,1);
* // 0.5377
*/
function pnormrnd_(mu, sigma) {
	// Initialize default parameter
	if (mu == undefined) {
		mu = 0;
	}
	if (sigma == undefined) {
		sigma = 1;
	}
	var sigma_sq = sigma*sigma;
	
	
	// Misc. initializations
	var A = 1.136717791056118;
	var mu_a = (1 - A*A)/A*sigma;
	var mu_b = 0;
	var mu_c = sigma * Math.sqrt(Math.PI/2);
	
	
	// Core loop of the algorithm, converging per lemma 1 of the reference
	var z;
	while (true) {
		//
		var rho;
		
		// 4. Exponential distribution
		if (mu < mu_a) {
			var a = (-mu + Math.sqrt(mu*mu + 4*sigma_sq)) / 2 / sigma_sq;
			
			z = -Math.log(1 - Math.random())/a;
			rho = Math.exp( -(z-mu)*(z-mu) / 2 / sigma_sq - a*(mu-z+a*sigma_sq/2) );
		}
		// 3. Normal distribution truncated at the mean, with equality because 3 is faster to compute than 2
		else if (mu <= mu_b) { 
			z = Math.abs(normrnd_())*sigma + mu;
			rho = (z >= 0) ? 1 : 0;
		}
		// 2. Normal distribution coupled with the uniform one
		else if (mu < mu_c) { 
			var r = (Math.random() < mu/(mu + Math.sqrt(Math.PI/2)*sigma)) ? 1 : 0;
			var u = Math.random()*mu;
			var g = Math.abs(normrnd_()*sigma) + mu;
			
			z = r*u + (1-r)*g;
			rho = r*Math.exp(-(z-mu)*(z-mu) / 2 /sigma_sq) + (1-r);
		}
		// 1. Normal distribution
		else { 
			z = normrnd_()*sigma + mu;
			rho = (z >= 0) ? 1 : 0;
		}
		
		// Acceptance/rejection step
		if (Math.random() <= rho){
			break;
		}		
	}
	
	// Return the computed value
	return z;
}


/**
* @function norminv_
*
* @summary Compute the inverse of the standard normal cumulative distribution function.
*
* @description This function returns an approximation of the inverse standard normal cumulative distribution function, i.e.
* given p in [0,1] it returns an approximation to the x value satisfying p = Pr{Z <= x} where Z is a
* random variable following a standard normal distribution law.
*
* x is also called a z-score.
*
* The algorithm uses three separate rational minimax approximations: one rational approximation is used for the central region and the outer region is split into two sub-regions.
* The algorithm has a relative error whose absolute value is in the order of 1e-15.
*
* @see <a href="https://www.jstor.org/stable/2347330">Michael Wichura, Algorithm AS 241: The Percentage Points of the Normal Distribution., Applied Statistics, Volume 37, Number 3, pages 477-484, 1988.</a>
* 
* @param {number} p a probability value, real number belonging to interval [0,1].
* @return {number} an approximation to the x value satisfying p = Pr{Z <= x} where Z is a random variable following a standard normal distribution law.
*
* @example
* norminv_(0.5);
* // 0
*/
function norminv_(p) {
    // Checks
	if (p <= 0.0 || p >= 1.0) {
		if (p == 0.0) {
			return -Infinity;
		}
		else if (p == 1.0) {
			return Infinity;
		}
		else {
			throw "The probality p must be bigger than 0 and smaller than 1";
		}
	}

    var q = p - 0.5;

	var ppnd16;
	
    if (Math.abs(q) <= 0.425) { // P CLOSE TO 1/2
        var r = 0.180625 - q * q;
        var num_ppnd16 = ((((((r * 2.5090809287301226727E3 + 3.3430575583588128105E4) * r + 6.7265770927008700853E4) * r + 4.5921953931549871457E4) * r + 1.3731693765509461125E4) * r + 1.9715909503065514427E3) * r + 1.3314166789178437745E2) * r + 3.3871328727963666080E0;
		var denom_ppnd16 = ((((((r * 5.2264952788528545610E3 + 2.8729085735721942674E4) * r + 3.9307895800092710610E4) * r + 2.1213794301586595867E4) * r + 5.3941960214247511077E3) * r + 6.8718700749205790830E2) * r + 4.2313330701600911252E1) * r + 1.0;
		ppnd16 = q * num_ppnd16 / denom_ppnd16;
    }
    else {
		var r;
		if ( q < 0.0 ) {
		  r = p;
		}
		else {
		  r = 1.0 - p;
		}

		//if ( r <= 0.0 ) {
		// No need for this check, as it has already been done at the beginning of the function
		//}
		
        r = Math.sqrt(-Math.log(r));

        if (r <= 5) { // P NEITHER CLOSE TO 1/2 NOR 0 OR 1
            r = r - 1.6;
			var num_ppnd16 = ((((((r * 7.74545014278341407640E-4 + 2.27238449892691845833E-2) * r + 2.41780725177450611770E-1) * r + 1.27045825245236838258E0) * r + 3.64784832476320460504E0) * r + 5.76949722146069140550E0) * r + 4.63033784615654529590E0) * r + 1.42343711074968357734E0;
			var denom_ppnd16 = ((((((r * 1.05075007164441684324E-9 + 5.47593808499534494600E-4) * r + 1.51986665636164571966E-2) * r + 1.48103976427480074590E-1) * r + 6.89767334985100004550E-1) * r + 1.67638483018380384940E0) * r + 2.05319162663775882187E0) * r + 1.0;
			ppnd16 = num_ppnd16 / denom_ppnd16;
        }
        else { // COEFFICIENTS FOR P NEAR 0 OR 1
            r = r - 5.0;
			var num_ppnd16 = (((((((r * 2.01033439929228813265E-7 + 2.71155556874348757815E-5) * r + 1.24266094738807843860E-3) * r + 2.65321895265761230930E-2) * r + 2.96560571828504891230E-1) * r + 1.78482653991729133580E0) * r + 5.46378491116411436990E0) * r + 6.65790464350110377720E0);
			var denom_ppnd16 = (((((((r * 2.04426310338993978564E-15 + 1.42151175831644588870E-7) * r + 1.84631831751005468180E-5) * r + 7.86869131145613259100E-4) * r + 1.48753612908506148525E-2) * r + 1.36929880922735805310E-1) * r + 5.99832206555887937690E-1) * r + 1.0);
			ppnd16 = num_ppnd16 / denom_ppnd16;
        }

        if (q < 0.0) {
            ppnd16 = -ppnd16;
        }
    }

	// Return the computed value
    return ppnd16;
}


/**
* @function hypersphereRandomSampler_
*
* @summary Returns a function to compute random points on the unit hypersphere of R^n.
*
* @description This function constructs a function to compute random points uniformly distributed on
* the unit hypersphere of R^n, using the algorithm of the reference.
* 
* @see <a href="https://dl.acm.org/citation.cfm?id=377946">	Mervin E. Muller, A note on a method for generating points uniformly on n-dimensional spheres, Communications of the ACM CACM Homepage archive
Volume 2 Issue 4, April 1959 Pages 19-20 </a>
* @see Nicholas J. Higham. 2002. Accuracy and Stability of Numerical Algorithms (2nd ed.). Soc. for Industrial and Applied Math., Philadelphia, PA, USA. 
*
* @param {number} n the dimension of the unit hypersphere of R^n, natural integer superior or equal to 1.
* @param {boolean} reuseOutputArray an optional boolean that can be set to true to re-use the same output array throughout
* all the computations (this improves the performances, but requires the caller to NOT alter the output array); defaults to false.
* @return {function} a function to be used through its .sample() method, computing random  
* points on the unit hypersphere of R^n.
*
* @example
* var mySampler = new hypersphereRandomSampler_(3);
* mySampler.sample();
* // [1, 0, 0]
*/
function hypersphereRandomSampler_(n, reuseOutputArray) {
	// Initializations
	this.n = n;
	this.x = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n); // the coordinates of a point being sampled
	this.reuseOutputArray = reuseOutputArray;
	
	/**
	* @function sample
	*
	* @summary Returns a random point on the unit hypersphere of R^n.
	*
	* @description This function computes a point choosen uniformly at random on the unit hypersphere of R^n,
	* using the algorithm of the reference.
	*
	* @memberof hypersphereRandomSampler_
	* @return {Array.<number>|Float64Array} an array of n real numbers corresponding to the coordinates of the computed point in R^n.
	*
	*/
	this.sample = function() {
		// Computation of n independent random variables from N(0,1), which will form the basis
		// of the coordinates of the point being sampled.
		//
		// In parallel, compute the 2 norm of the associated vector, for subsequent 
		// normalization, with an accurate algorithm by S. J. Hammarling
		// C.f. problem 27.5 of the second reference.
		var t = 0;
		var s = 1;
		for (var i = 0; i < this.n; ++i) {
			// Generate a random variable from N(0,1)
			var r = normrnd_();
			
			// Set the i-th coordinate of the point being sampled.
			this.x[i] = r;
			
			// Compute the running 2 norm of the associated vector.
			var absR = Math.abs(r);
			if (absR != 0) {
				if (absR > t) {
					s = 1 + s * (t/r) * (t/r);
					t = absR;
				}
				else  {
					s = s + (r/t) * (r/t);
				}
			}
		}

		// Normalization of the computed coordinates of the point being sampled, so that
		// the 2-norm of the associated vector in R^n is equal to 1.
		var x_two_norm = t * Math.sqrt(s);
		for (var i = 0; i < this.n; ++i) {
			this.x[i] = this.x[i]/x_two_norm;
		}
		
		// Return either the point being sampled, or a copy of the point being sampled so that callers can alter it
		if (this.reuseOutputArray) {
			return this.x;
		}
		else {
			return this.x.slice(0);
		}
	}
}


/**
* @function covariance_
*
* @summary Compute the covariance of two serie of values.
*
* @description This function returns the covariance of two series of values [x_1,...,x_p] and [y_1,...,y_p], 
* which is defined as the arithmetic mean of the p values (x_1-m_x)*(y_1-m_y),...,(x_p-m_x)*(y_p-m_y), 
* where m_x is the arithmetic mean of the p values x_1,...,x_p and m_y is the arithmetic mean of the p values y_1,...,y_p.
*
* The algorithm implemented uses a two pass formula in order to reduce the computation error, c.f. the reference.
*
* @see <a href="http://dl.acm.org/citation.cfm?doid=365719.365958">Peter M. Neely (1966) Comparison of several algorithms for computation of means, standard deviations and correlation coefficients. Commun ACM 9(7):496–499.</a>
*
* @param {Array.<number>} x an array of real numbers.
* @param {Array.<number>} y an array of real numbers of the same length as x.
* @return {number} the covariance of the values of the arrays x and y.
*
* @example
* covariance_([4, 7, 13, 16], [4, 7, 13, 16]); 
* // 22.5
*/
function covariance_(x, y) {
	// Initialisations
	var nn = x.length;

	// Compute the mean of the input numeric arrays (first pass)
	var meanX = mean_(x);
	var meanY = mean_(y);

	// Compute the sum of the product of the deviations plus the correction factor (second pass)
	// C.f. P_4 formula of the reference
	var sumProdDiff = 0.0;
	var sumDiffX = 0.0;
	var sumDiffY = 0.0;
	for (var i=0; i<nn; ++i) {
		var diffX = (x[i] - meanX);
		var diffY = (y[i] - meanY);
		sumProdDiff += diffX * diffY;
		sumDiffX += diffX;
		sumDiffY += diffY;
	}

	// Compute the corrected sum of the product of the deviations from the means
	var C = sumProdDiff - ((sumDiffX * sumDiffY) / nn);

	// Return the corrected covariance
	return C/nn;
}


/**
* @function sampleCovariance_
*
* @summary Compute the sample covariance of two serie of values.
*
* @description This function returns the sample covariance of two series of values [x_1,...,x_p] and [y_1,...,y_p], 
* which is defined as the covariance of two series of values [x_1,...,x_p] and [y_1,...,y_p] multiplied by p/(p-1).
*
* The algorithm implemented uses a two pass formula in order to reduce the computation error, c.f. the function covariance_.
*
* @param {Array.<number>} x an array of real numbers.
* @param {Array.<number>} y an array of real numbers of the same length as x.
* @return {number} the covariance of the values of the arrays x and y.
*
* @example
* sampleCovariance_([4, 7, 13, 16], [4, 7, 13, 16]); 
* // 30
*/
function sampleCovariance_(x, y) {
	var nn = x.length;
	return covariance_(x,y) * nn/(nn - 1);
}


/**
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 
 
/**
* @function thresholdAcceptingSolve_
*
* @summary Returns a possible solution to a minimization problem, 
* using the threshold accepting algorithm.
*
* @description This function computes a possible solution to a minimization problem 
* defined on any n-dimensional space E using the threshold accepting algorithm 
* (heuristic stochastic algorithm).
*
* The problem is assumed to be provided in the following format:
*
* min f(x), x in E
*
* where:
* - f: E -> R is a function
*
* The problem is assumed to be solvable, i.e., argmin f(x), x in E is assumed to be non-empty.
*
* The algorithm used internally is the threshold accepting algorithm, c.f. the first reference.
*
* To be noted that this algorithm is an heuristic stochastic algorithm, so that there is no guarantee
* that the point computed is a solution to the minimization problem.
*
* @see <a href="https://www.sciencedirect.com/science/article/pii/002199919090201B">Gunter Dueck Tobias Scheuer, Threshold accepting: A general purpose optimization algorithm appearing superior to simulated annealing, Journal of Computational Physics Volume 90, Issue 1, September 1990, Pages 161-175</a>
* @see <a href="https://www.sciencedirect.com/science/article/abs/pii/S0167819109001197">Manfred Gilli, Enrico Schumann, Distributed optimisation of a portfolio’s Omega, Parallel Computing, Volume 36, Issue 7, July 2010, Pages 381-389</a>
* @see <a href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=910233">Gilli, Manfred and Këllezi, Evis and Hysi, Hilda, A Data-Driven Optimization Heuristic for Downside Risk Minimization. Swiss Finance Institute Research Paper No. 06-2.</a>
*
* @param {function} f, a function representing the function f above, which must take as input argument
* an array of n elements corresponding to a point in the n-dimensional space E and which must return
* as output a real number corresponding to f(x).
* @param {Matrix_} x0, an array of n elements corresponding to the point in the n-dimensional space E
* on which to start the algorithm (usually, the best possible guess of the optimal solution).
* @param {object} opt the optional parameters for the algorithm.
* @param {number} opt.nRounds the number of rounds of the algorithm, a strictly positive natural integer; defaults to 10.
* @param {number} opt.nSteps the number of steps per round of the algorithm, a strictly positive natural integer; defaults to 5000.
* @param {number} opt.nDeltas the number of random steps used to generate the thresholds, a strictly positive natural integer; defaults to opt.nSteps.
* @param {function} opt.neighbourGenerator, the neighbour generating function, which must take two input arguments:
* - x, an array of n elements corresponding to a current point in the n-dimensional space E
* - neighbourGeneratorParameters, an object corresponding to any required parameters
* and which must return as output an array of n elements corresponding to a "small" stochastic perturbation of x in the n-dimensional space E; 
* defaults to a uniform sampling function over an hypercube of R^n of diameter opt.neighbourGeneratorParameters.alpha centered around x in R^n,
* adjusted for optional lower bounds constraints provided in opt.neighbourGeneratorParameters.lowerBounds as well
* as for optional upper bounds constraints provided in opt.neighbourGeneratorParameters.upperBounds.
* @param {object} opt.neighbourGeneratorParameters the optional parameters for the neighbour generating function; defaults to empty if opt.neighbourGenerator
* is set, or defaults to the following object if opt.neighbourGenerator is not set:
* opt.neighbourGeneratorParameters.alpha
* opt.neighbourGeneratorParameters.lowerBounds
* opt.neighbourGeneratorParameters.upperBounds
* @param {number} opt.neighbourGeneratorParameters.alpha the optional diameter of the hypercube in R^n in which to sample a neighbor around a
* current point in R^n, a strictly positive real number; defaults to 1e-3 in case opt.neighbourGeneratorParameters is not set
* @param {Array.<number>} opt.neighbourGeneratorParameters.lowerBounds an optional array of n real numbers containing lower bounds constraints l_i, i=1..n with l_i <= u_i, i=1..n; defaults to empty.
* @param {Array.<number>} opt.neighbourGeneratorParameters.upperBounds an optional array of n real numbers containing upper bounds constraints u_i, i=1..n with l_i <= u_i, i=1..n; defaults to empty.
*
* @return {Array<Object>} an array arr containing two elements: 
* - arr[0] an array of n elements corresponding to a possible solution x^* to the problem in the n-dimensional space E
* - arr[1] the possible optimal value of the function f, f(x^*)
*
*/
function thresholdAcceptingSolve_(f, x0, opt) { 
	// Default neighbour generator on R^n, 
	// with optional lower and upper bounds constraints.
	function defaultNeighbourGenerator(x, neighbourGeneratorParameters) {
		// Decode the input parameters
		var alpha = neighbourGeneratorParameters.alpha;
		var l = neighbourGeneratorParameters.lowerBounds;
		var u = neighbourGeneratorParameters.upperBounds;
		
		// Initialize the dimension
		var n = x.length;
		
		// Randomly generate a neighbour from an hypercube of diameter alpha
		// centered at x, taking bound constraints into account.
		var xl = x.slice();
		var xu = x.slice();
		for (var i = 0; i < n; ++i) {
			// Default interval is [x_i - alpha/2, xi + alpha/2]
			xl[i] = x[i] - alpha/2;
			xu[i] = x[i] + alpha/2;
			
			// Truncated interval [x_i - alpha/2, xi + alpha/2] n [l_i, u_i]
			if (l) {
				xl[i] = Math.max(xl[i], l[i]);
			}
			if (u) {
				xu[i] = Math.min(xu[i], u[i]);
			}
		}
		
		// Randomly sample from this hypercube
		var xx = new boxRandomSampler_(n, xl, xu).sample();
		

		// Return the sampled vector
		return xx;
	}
	
	
	// Internal function to generate the list of thresholds
	// 
	// It is based on algorithm 2 of the first reference.
	function computeThresholds(f, x_c, neighbourGeneratorParameters, nDeltas, nRounds) {	
		//
		var f_x_c = f(x_c);
		
		// Compute the changes in the objective function (delta_i), i = 1..nDeltas
		// resulting from small perturbations of feasible points.
		var deltas = typeof Float64Array === 'function' ? new Float64Array(nDeltas) : new Array(nDeltas);
		for (var i = 0; i < nDeltas; ++i) {
			// Generate a neighbour of the current point
			var x_i = neighbourGenerator(x_c, neighbourGeneratorParameters);
			
			// Compute the function value at the generated neighbour
			var f_x_i = f(x_i);
			
			// Compute delta_i
			deltas[i] = Math.abs(f_x_c - f_x_i);
			
			// Define the new current point as the generated neighbour
			x_c = x_i;
			f_x_c = f_x_i;
		}
		
		// Preliminary sort of (delta_i), i = 1..nDeltas in increasing order,
		// to speed up the quantile computations below.
		deltas.sort(function(a, b) { return a-b });

		// Compute the empirical distribution of (delta_i), i = 1..nDeltas,
		// and compute the associated threshold sequence (tau_r), r = 1..nRounds.		
		var taus = typeof Float64Array === 'function' ? new Float64Array(nRounds) : new Array(nRounds);
		for (var i = 0; i < nRounds; ++i) {
			taus[i] = quantile_(deltas, (nRounds - (i+1))/nRounds, true);
		}
		
		// Force the 0-th quantile to 0, like the authors of the second reference 
		// implemented in their R code.
		taus[nRounds-1] = 0;
		
		// Return the computed thresholds
		return taus;
	}
	
	
	// ------
	
	
	// Misc. initializations
	var n = x0.nbRows;
	
	
	// ------
	
	
	// Decode options
	if (opt === undefined) {
		opt = {};
	}
	
	// The number of thresholds, 
	// c.f. the second reference for the default value.
	var nRounds = opt.nRounds;
	if (nRounds === undefined) {
		nRounds = 10;
	}

	// The number of steps per threshold,
	// c.f. the third reference for the default value.
	var nSteps = opt.nSteps;
	if (nSteps === undefined) {
		nSteps = 5000;
	}

	// The number of random steps to generate the thresholds,
	// c.f. the third reference for the default value.
	var nDeltas = opt.nDeltas;
	if (nDeltas === undefined) {
		nDeltas = nSteps;
	}

	// The neighbour generator
	//
	// In case the default neighbour generator is used, 
	// the diameter of the hypercube centered around a current
	// iterate from which to sample a new point needs to be defined.
	var neighbourGenerator = opt.neighbourGenerator;
	var neighbourGeneratorParameters = opt.neighbourGeneratorParameters;
	if (neighbourGenerator === undefined) {
		neighbourGenerator = defaultNeighbourGenerator;
		
		if (neighbourGeneratorParameters === undefined || 
		    neighbourGeneratorParameters.alpha === undefined) {
			neighbourGeneratorParameters = { alpha: 1e-3 };
		}
	}
	
	
	// ------
	
	
	// Generate the list of thresholds
	var x_c = x0.slice();
	var taus = computeThresholds(f, x_c, neighbourGeneratorParameters, nDeltas, nRounds);

	
	// Core algorithm, c.f. algorithm 1 of the first reference
	var x_best = x0.slice();
	var f_x_best = f(x_best);
	var x_c = x0.slice();
	var f_x_c = f(x_c);
	for (var r = 0; r < nRounds; ++r) {
		for (var i = 0; i < nSteps; ++i) {
			// Save the current point, in case it is altered by the neighbourGenerator method
			var x_c_tmp = x_c.slice();
			
			// Generate a neighbour of the current point		
			var x_ri = neighbourGenerator(x_c, neighbourGeneratorParameters);
			
			// Compute the function value at the generated neighbour
			var f_x_ri = f(x_ri);
			
			// Compute delta
			var delta = f_x_ri - f_x_c;

			// In case delta is lower than the current threshold,
			// define the generated neighbour as the new current point.
			//
			// Otherwise, the current point is left unchanged,
			// but due to possible alteration of x_c, it is re-initialized.
			if (delta < taus[r]) {
				x_c = x_ri.slice();
				f_x_c = f_x_ri;
			}
			else {
				x_c = x_c_tmp;
			}
			
			// Additionally, in case the generated neighbour is strictly better
			// than the current point, save it as the best point foud so far.
			if (f_x_ri < f_x_best) {
				f_x_best = f_x_ri;
				x_best = x_ri.slice();
			}
		}
	}

	
	// The solution computed by the Threshold Algorithm should be 
	// the latest current point, but since this algorithm is stochastic,
	// the solution must rather be the best solution encountered.
	return [x_best, f_x_best];
}
	
 
/**
* @function gssSolve_
*
* @summary Returns a possible solution to a minimization problem, 
* using a generating set search algorithm.
*
* @description This function computes a possible solution to a minimization problem 
* defined on R^n using a generating set search algorithm (direct search algorithm).
*
* The problem is assumed to be provided in the following format:
*
* min f(x), x in R^n
*
* optionally s.t. l <= x <= u (finite bound constraints)
*
* where:
* - f: R^n -> R is a function
* - l an n by 1 matrix
* - u an n by 1 matrix
*
* The problem is assumed to be solvable, i.e., argmin f(x), x in R^n or 
* argmin f(x), x in R^n n [l, u], is assumed to be non-empty.
*
* The algorithm used internally is a generating set search algorithm, based on both
* deterministic and random polling sets, c.f. the first and the second references.
*
* To be noted that while the convergence of the algorithm is ensured for a large class
* of functions, c.f. the fourth reference, there is no guarantee that the point computed
* is a solution to the minimization problem.
*
* @see <a href="https://epubs.siam.org/doi/abs/10.1137/140961602">S. Gratton, C. W. Royer, L. N. Vicente, and Z. Zhang, Direct Search Based on Probabilistic Descent, SIAM J. Optim., 25(3), 1515–1541.</a>
* @see <a href="https://link.springer.com/article/10.1007%2Fs10589-019-00062-4">S. Gratton, C. W. Royer, L. N. Vicente, and Z. Zhang, Direct search based on probabilistic feasible descent for bound and linearly constrained problems, Computational Optimization and Applications volume 72, pages 525–559 (2019)</a>
* @see <a href="https://hal.archives-ouvertes.fr/tel-01688027#">C. Royer, Derivative-Free Optimization Methods based on Probabilistic and Deterministic Properties: Complexity Analysis and Numerical Relevance, PhD Thesis</a> 
* @see <a href="https://link.springer.com/article/10.1007/s10107-010-0429-8">L. N. Vicente and A. L. Custodio, Analysis of direct searches for discontinuous functions, Mathematical Programming volume 133, pages 299–325 (2012)</a>
*
* @param {function} f, a function representing the function f above, which must take as input argument
* a n by 1 matrix x corresponding to a point in R^n and which must return as output a real number 
* corresponding to f(x).
* @param {Matrix_} x0, an n by 1 matrix corresponding to a feasible point on which to
* start the algorithm (usually, the best possible guess of the optimal solution).
* @param {Matrix_} l an optional n by 1 matrix corresponding to the lower bounds constraints (required if u is provided).
* @param {Matrix_} u an optional n by 1 matrix corresponding to the upper bounds constraints (required if l is provided).
* @param {object} opt the optional parameters for the algorithm.
* @param {number} opt.eps the absolute tolerance for the convergence of the algorithm, a strictly positive real number; defaults to 1e-06.
* @param {number} opt.maxIter the maximum number of iterations of the algorithm, a strictly positive natural integer or -1 to force an infinite number of iterations; defaults to 10000.
* @param {number} opt.alphaZero the initial value of the step size, a strictly positive real number; defaults to 1.
* @param {number} opt.alphaMax the maximum value of the step size, a strictly positive real number; defaults to 1e10.
* @param {number} opt.gamma the factor by which the step size is multiplied if an improved point is found, a real number belonging to [1,+infinity[; defaults to 1 in case of .
* @param {number} opt.theta the factor by which the step size is multiplied if no improved point is found, a real number belonging to ]0,1[; defaults to 0.5.
* @param {string} opt.unconstrainedPollingSet the polling set to consider in case no bounds constraints are active (or defined),
* , a string either equal to:
* - 'coordinateDirections' to use the polling set equal to the positive spanning set D_+ = {e_1, ..., e_n, -e_1, ..., -e_n}
* - 'probabilisticDescentDirections' to use the polling set made of random directions uniformly distributed on the unit sphere of R^n
* - 'custom' to use a custom polling set
* ; defaults to 'coordinateDirections'
* @param {string} opt.constrainedPollingSet the polling set to consider in case bounds constraints are active,
* , a string either equal to:
* - 'coordinateDirections' to use the polling set equal to the positive spanning set D_+ = {e_1, ..., e_n, -e_1, ..., -e_n}
* - 'custom' to use a custom polling set
* ; defaults to 'coordinateDirections'
* @param {string} opt.pollingType the polling strategy to use when searching the polling set for a 
* direction of sufficient decrease, a string either equal to:
* - 'opportunistic' to search the polling set for the first direction with a sufficient decrease in function value
* - 'complete' to search the polling set for the direction with the lowest sufficient decrease in function value
* ; defaults to 'opportunistic'
* @param {function} opt.rho, the forcing function used in order to determine what is a sufficient decrease
* in function value, which must take as input argument a real number and which must return as output a real number; 
* defaults to the function x -> x^2/2
*
* @return {Array<Object>} an array arr containing two elements: 
* - arr[0] an n by 1 matrix containing a possible solution x^* to the problem
* - arr[1] the possible optimal value of the function f, f(x^*)
*
*/
 function gssSolve_(f, x0, l, u, opt) {
	// Internal function.
	//
	// Definition of the polling set generator made of the coordinate directions and their negatives, 
	// which is:
	// - The positive spanning set equal to D_+ = {e_1, ..., e_n, -e_1, ..., -e_n} 
	// in case no bounds constraints are active, c.f. section 2.2 of the first reference
	// - The approximate tangent cone equal to {e_i, i in Ip} U {-e_i, i in Im}
	// in case bounds constraints are active, c.f. formula 5.6 of the third reference
	function coordinateDirectionsPollingSetGenerator(x, alpha, Ip, Im) {
		// Initializations
		this.n = x.nbRows;
		this.alpha = alpha;
		this.nbGeneratedPollingDirections = 0;
		this.d = Matrix_.zeros(n, 1); // placeholder for the coordinate direction to generate at each call of the .next() method

		// Initialization of the polling directions, either to:
		// - {e_1, ..., e_n, -e_1, ..., -e_n}, in case no bound constraints are imposed
		// - the approximate tangent cone at (x, alpha), as described in formula 5.6 of the third reference
		//
		// Note: The polling directions are not computed here, only their indices.
		this.nbPollingDirections;
		this.pollingDirectionsIndices;
		if (Ip && Im) {	
			// The polling directions indices are {i, i in Ip} U {-i, i in Im}, 
			// c.f. formula 5.6 of the third reference.
			this.nbPollingDirections = Ip.length + Im.length;
			this.pollingDirectionsIndices = typeof Int32Array === 'function' ? new Int32Array(this.nbPollingDirections) : new Array(this.nbPollingDirections);
			for (var i = 0; i < Ip.length; ++i) {
				this.pollingDirectionsIndices[i] = Ip[i];
			}
			for (var i = Ip.length, j= 0; i < this.nbPollingDirections; ++i, ++j) {
				this.pollingDirectionsIndices[i] = -Im[j];
			}
		}
		else {
			// The polling directions indices are {1,2,...,n,-1,...,-n}
			this.nbPollingDirections = 2*this.n;
			this.pollingDirectionsIndices = typeof Int32Array === 'function' ? new Int32Array(this.nbPollingDirections) : new Array(this.nbPollingDirections);
			for (var i = 0; i < this.n; ++i) {
				this.pollingDirectionsIndices[i] = i + 1;
			}
			for (var i = this.n, j = 0; i < 2*this.n; ++i, ++j) {
				this.pollingDirectionsIndices[i] = - (j + 1);
			}
		}

		
		// ------
		

		// Iterator on the polling set directions.
		//
		// Generate polling directions corresponding to the 
		// the computed coordinate directions indices.
		this.next = function() {		
			// In case all the polling directions have already been generated, 
			// there is nothing more to do.
			if (this.nbGeneratedPollingDirections >= this.nbPollingDirections) {
				return -1;
			}


			// The coordinate directions +-e_i, i=1..n are null vectors, except on their i-th element 
			// equal to 1 (+e_i) or to -1 (-e_i).
			//
			// This observation allows to optimize the generation of the coordinate directions vectors
			// thanks to a simple reset to 0 / set to +-1 mechanism.

			// Reset the polling direction to generate to a null vector,
			// if a polling direction has already been generated.
			if (this.nbGeneratedPollingDirections >= 1) {
				var previousPollingDirectionIndice = this.pollingDirectionsIndices[this.nbGeneratedPollingDirections - 1];
				if (previousPollingDirectionIndice < 0) {
					this.d.data[-previousPollingDirectionIndice - 1] = 0;
				}
				else if (previousPollingDirectionIndice > 0) {
					this.d.data[previousPollingDirectionIndice - 1] = 0;
				}
				else {
					throw new Error('internal error: 0 polling direction indice detected');
				}
			}

			// Set to 1 or to -1 the proper coordinate of the polling direction to generate.
			var pollingDirectionIndice = this.pollingDirectionsIndices[this.nbGeneratedPollingDirections];
			if (pollingDirectionIndice < 0) {
				this.d.data[-pollingDirectionIndice - 1] = -1;
			}
			else if (pollingDirectionIndice > 0) {
				this.d.data[pollingDirectionIndice - 1] = 1;
			}
			else {
				throw new Error('internal error: 0 polling direction indice detected');
			}

			
			// Increment the number of generated polling directions
			++this.nbGeneratedPollingDirections;

			
			// Return the generated polling direction
			return this.d;
		}
	}

	
	// Internal function.
	//
	// Definition of the polling set generator made of random directions uniformly distributed
	// on the unit sphere of R^n, c.f. Appendix B of the first reference.
	function randomUnitSpherePollingSetGenerator(x, alpha) {
		// Initializations
		this.n = x.nbRows;
		this.nbGeneratedPollingDirections = 0;
		this.d = Matrix_.zeros(n, 1); // placeholder for the direction to generate at each call	
		this.nbPollingDirections = Math.floor(Math.log( 1 - Math.log(theta)/Math.log(gamma) ) / Math.log(2)) + 1; // = m in section 5.4 of the second reference, the minimal number of random directions to generate
		this.hypersphereRandomSampler = new hypersphereRandomSampler_(this.n, true); // uniform sampler of directions on the unit sphere, with output array re-usage for improved performances
		
		
		// ------
		

		// Iterator on the polling set directions.
		//
		// Generate polling directions corresponding to random 
		// directions uniformly distributed on the unit sphere of R^n.
		this.next = function() {
			// In case all the polling directions have already been generated, 
			// there is nothing more to do.
			if (this.nbGeneratedPollingDirections >= this.nbPollingDirections) {
				return -1;
			}
			
			
			// Specific case if m = 2, c.f. section 7 of the first reference,
			// for which the set D_k = {v, -v} is optimal.
			if (this.nbPollingDirections === 2 && this.nbGeneratedPollingDirections === 1) {
				this.d = Matrix_.ax(-1, this.d, this.d);
			}
			else {
				// Generate a random vector uniformly distributed on the unit sphere of R^n.
				var vect = this.hypersphereRandomSampler.sample();
				this.d = Matrix_.fill(this.n, 1, function(i,j) { return vect[i-1]; }, this.d);
			}
			
			
			// Increment the number of generated polling directions
			++this.nbGeneratedPollingDirections;

			
			// Return the generated direction
			return this.d;
		}
	}
	
	
	// ------
	
	
	// Misc. initializations
	var n = x0.nbRows;
	var eps_tol = 1e-12; // used to numerically determine some conditions

	
	// ------
	
	
	// Decode options
	if (opt === undefined) {
		opt = {};
	}
	
	// The maximum number of iterations of the GSS algorithm
	var maxIterations = opt.maxIter;
	if (maxIterations === undefined) {
		maxIterations = 10000;
	}
	
	// The tolerance value under which the GSS algorithm is considered to have converged
	var eps = opt.eps;
	if (eps === undefined) {
		eps = 1e-6;
	}
	
	// The lower and upper bounds constraints
	if (l && u) {
		if (l.length != u.length) {
			throw new Error("incompatible number of lower bounds and upper bounds constraints: " + l.length + " v.s. " + u.length);
		}
		else {
			l = new Matrix_(l);
			u = new Matrix_(u);
		}
	}
	if (l && !u) {
		throw new Error('missing upper bounds constraints');
	}
	else if (!l && u) {
		throw new Error('missing lower bounds constraints');
	}

	// The polling set in case of no active bounds constraints
	var unconstrainedPollingSet = opt.unconstrainedPollingSet;
	if (unconstrainedPollingSet === undefined) {
		unconstrainedPollingSet = 'coordinateDirections';
	}
	if (unconstrainedPollingSet !== 'coordinateDirections' 
	    && unconstrainedPollingSet !== 'probabilisticDescentDirections'
		&& unconstrainedPollingSet !== 'custom') {
		throw new Error('unsupported unconstrained polling set');
	}
	
	// The generator of the polling set in case of no active bounds constraints.
	var unconstrainedPollingSetGenerator;
	if (unconstrainedPollingSet === 'coordinateDirections') {
		unconstrainedPollingSetGenerator = coordinateDirectionsPollingSetGenerator;
	}
	else if (unconstrainedPollingSet === 'probabilisticDescentDirections') {
		unconstrainedPollingSetGenerator = randomUnitSpherePollingSetGenerator;
	}
	else if (unconstrainedPollingSet === 'custom') {
		unconstrainedPollingSetGenerator = opt.customUnconstrainedPollingSetGenerator;
	}
	else {
		throw new Error('internal error: unsupported unconstrained polling set detected');
	}

	// The polling set in case of active bounds constraints
	var constrainedPollingSet = opt.constrainedPollingSet;
	if (constrainedPollingSet === undefined) {
		constrainedPollingSet = 'coordinateDirections';
	}
	if (constrainedPollingSet !== 'coordinateDirections' 
		&& constrainedPollingSet !== 'custom') {
		throw new Error('unsupported constrained polling set');
	}
	
	// The generator of the polling set in case of active bounds constraints.
	var constrainedPollingSetGenerator;
	if (constrainedPollingSet === 'coordinateDirections') {
		constrainedPollingSetGenerator = coordinateDirectionsPollingSetGenerator;
	}
	else if (constrainedPollingSet === 'custom') {
		constrainedPollingSetGenerator = opt.customConstraintedPollingSetGenerator;
	}
	else {
		throw new Error('internal error: unsupported constrained polling set detected');
	}
	
	// The initial step size
	var alphaZero = opt.alphaZero;
	if (alphaZero === undefined) {
		alphaZero = 1;
	}

	// The maximum value of the step size
	var alphaMax = opt.alphaMax;
	if (alphaMax === undefined) {
		alphaMax = 1e10;
	}
	
	// Gamma, the factor by which the step size is multiplied if an improved point is found.
	//
	// By default, gamma is equal to 1 in case of deterministic direct search based on positive spanning sets, 
	// or equal to 2 in case of probabilistic descent, c.f. section 5 of the first reference.
	//
	// In case of custom polling set, gamma is set to 1.
	var gamma = opt.gamma;
	if (gamma === undefined) {
		if (unconstrainedPollingSet === 'coordinateDirections') {
			gamma = 1;
		}
		else if (unconstrainedPollingSet === 'probabilisticDescentDirections') {
			gamma = 2;
		}
		else if (unconstrainedPollingSet === 'custom') {
			gamma = 1;
		}
		else {
			throw new Error('internal error: unsupported unconstrained polling set detected');
		}
	}
	
	// Theta, the factor by which the step size is multiplied if no improved point is found
	//
	// C.f. section 2.2 of the first reference.
	var theta = opt.theta;
	if (theta === undefined) {
		theta = 0.5;
	}

	// The polling type
	var pollingType = opt.pollingType;
	if (pollingType === undefined) {
		pollingType = 'opportunistic';
	}
	if (pollingType !== 'opportunistic' && pollingType !== 'complete') {
		throw new Error('unsupported polling type');
	}
	
	// Initialization of the forcing function.
	//
	// By default, it is equal to f: x -> x^2/2, as proposed in
	// section 1 of the first reference.
    var rho = opt.rho; 
	if (rho === undefined) {
		rho = function (alpha) {
			return alpha * alpha / 2;
		}
	}
	
	
    // ------


	// Initialization of the x iterates
	var x_k = Matrix_.copy(x0); // placeholder for the x_k vector
	var x_kp = Matrix_.copy(x0); // placeholder for the x_kp vector
	var x_kp_best = Matrix_.copy(x0); // placeholder for the best x_kp vector, mostly used in case of complete polling
	var f_x_k = f(x_k); // placeholder for the f(x_k) value
	var f_x_kp = f(x_kp); // placeholder for the f(x_kp) value
	var f_x_kp_best = undefined; // placeholder for the best f(x_kp) value, mostly used in case of complete polling
	
	// Initialization of the step size
	var alpha_k = alphaZero;

	
	// ------
		

	// Main loop of the Algorithm 2.1 of the fourth reference,
	// guaranteed to converge per theorem 2.2 of the fourth reference,
	// provided certain conditions on f and on the set of polling directions D are met.
	var iter = 0;
	while (true) {
		// Check the number of iterations
		if (maxIterations !== -1 && iter > maxIterations) {
			throw new Error('maximum number of iterations reached: ' + maxIterations);
		}
		
		
		// Update the number of iterations
		++iter;
		
		
		// Update of rho_alpha_k 
		var rho_alpha_k = rho(alpha_k);
		
		
		// Search step (acceleration moves)
        //
		// Try to compute a point x_* such that f(x_*) < f (x_k) - rho(alpha_k), using any heuristic.
		//
		// If such a point is found then set x_k+1 = x_*, consider the search step as successful, and skip the poll step.
		var searchSuccessful = false;
		

		// Poll step (exploratory moves using movements called "patterns")
		//
		// Compute a finite polling set D_k of normalized directions in R^n, which is
		// searched for a direction d_k in the polling set D_k such that 
		// f(x_k + alpha_k * d_k) < f(x_k) - rho(alpha_k).
		// 
		// If such a direction d_k is found, the poll step is considered as successful, and:
		// - In case the polling is opportunistic, the poll step is stopped
		// - In case the polling is complete, the poll step continues until exhaustion 
		// of the polling set D_k, in order to tentatively find a better direction
		//
		// Otherwise, the poll step is considered as unsuccessful.
		var pollSuccessful = false;

		if (searchSuccessful === false) {		
			// Before any process, in case bound constraints are imposed, determine the index sets 
			// of the free bounds constraints at (x_k, alpha_k) named I^+ and I^- in 
			// formulas 5.5 of the third reference.
			//
			// Note: To ensure the future iterates stay numerically feasible, 
			// eps_tols is added in checking the boundary conditions.
			if (l && u) {
				var Ip = new Array(0);
				var Im = new Array(0);
				
				for (var i = 0; i < n; ++i) {
					if (x_k.data[i] + alpha_k <= u.data[i] - eps_tol) {
						Ip.push(i + 1);
					}
					
					if (l.data[i] + eps_tol <= x_k.data[i] - alpha_k) {
						Im.push(i + 1);
					}
				}
			}
			
			// Compute the polling set D_k for (x_k, alpha_k):
			// - In case there are active bounds constraints (Ip U Im <> D_+), 
			// use the constrained polling set generator
			// - Otherwise, use the unconstrained polling set generator
			var D_k;
			if ((l && u) && Ip.length + Im.length < 2*n) {
				D_k = new constrainedPollingSetGenerator(x_k, alpha_k, Ip, Im);
			}
			else {
				D_k = new unconstrainedPollingSetGenerator(x_k, alpha_k);
			}		
			
			// Iterate on the polling set D_k
			var d_k = D_k.next();
			while (d_k != -1) {
				x_kp = Matrix_.axpby(1, x_k, alpha_k, d_k, x_kp);
				f_x_kp = f(x_kp);
				
				if ( f_x_kp < f_x_k - rho_alpha_k ) {
					// The poll step is successful
					pollSuccessful = true;

					// In case of opportunistic polling, stops there.
					//
					// Else, in case of complete polling, determine if the current direction
					// is better than the best direction found so far, in which case
					// the current direction becomes the new best direction found so far.
					if (pollingType === 'opportunistic') {
						x_kp_best = Matrix_.copy(x_kp, x_kp_best);
						f_x_kp_best = f_x_kp;
						
						break;
					}
					else if (pollingType === 'complete') {
						if (f_x_kp_best === undefined) {
							x_kp_best = Matrix_.copy(x_kp, x_kp_best);
							f_x_kp_best = f_x_kp;						
						}
						else {
							if (f_x_kp < f_x_kp_best) {
								x_kp_best = Matrix_.copy(x_kp, x_kp_best);
								f_x_kp_best = f_x_kp;
							}
						}
					}
				}
				
				d_k = D_k.next(); 
			}
		}

		
		// Preparation of the next iteration:
		// - Update of the x_k iterate
		// - Update of the f_x_k iterate
		// - Reset of the f_x_kp_best iterate
		if (searchSuccessful === true || pollSuccessful === true) {
			x_k = Matrix_.copy(x_kp_best, x_k);
			f_x_k = f_x_kp_best;
			f_x_kp_best = undefined;
		}
		
		// - Update of the step size parameter
		if (pollSuccessful === true || searchSuccessful === true) {
			// Successful iteration:
			// - Increase the step size (unless it is already at maximum)
			alpha_k = Math.min(gamma * alpha_k, alphaMax);
		}
		else {
			// Unsuccessful iteration:
			// - Decrease the step size
			alpha_k = theta * alpha_k;			
		}

	
		// Stopping condition, based on Theorem 2.3 of the fourth reference
		if (alpha_k <= eps) {
			break;
		}
	}

	// Return the computed x_k value, as well as f(x_k)
	return [x_k, f_x_k];
}

/**
* @function goldenSectionSearch_
*
* @summary Returns a solution to a unidimensional minimization problem using the 
* golden section search method.
*
* @description This function returns a solution x^* to the problem min f(x), x in [x_min, x_max], where:
* - f: [x_min, x_max] -> R is a unimodal function, that is, such that f is monotonically non-increasing for x <= x^* 
* and monotonically non-decreasing for x >= x^*
*
* The algorithm used internally is the golden section search method, c.f. the first and the second
* references, which is guaranteed to converge.
*
* To be noted that when there are several solutions to the problem (i.e., when the function f is
* not strictly unimodal), the algorithm will converge to one of them.
*
* @see <a href="https://en.wikipedia.org/wiki/Golden-section_search">Golden-section search</a>
* @see William H. Press, Brian P. Flannery, Saul A. Teukolsky, William T. Vetterling, Numerical Recipes in C. The Art of Scientific Computing, 2nd Edition, 1992</a>
* @see <a href="https://www.jstor.org/stable/2032161">J. Kiefer, Sequential Minimax Search for a Maximum, Proceedings of the American Mathematical Society Vol. 4, No. 3 (Jun., 1953), pp. 502-506</a>
*
* @param {function} f, a function representing the function f above, which must take as input argument
* a real number corresponding to a point in the interval [x_min, x_max] and which must return as output a real number 
* corresponding to f(x).
* @param {number} x_min, a real number corresponding to the lower bound of the interval on which 
* to search for a solution to the problem min f(x), x in [x_min, x_max].
* @param {number} x_max, a real number corresponding to the upper bound of the interval on which 
* to search for a solution to the problem min f(x), x in [x_min, x_max].
* @param {object} opt the optional parameters for the algorithm.
* @param {number} opt.eps the absolute tolerance for the convergence of the algorithm, a strictly positive real number; defaults to 1e-06.
* @param {number} opt.maxIter the maximum number of iterations of the algorithm, a strictly positive natural integer or -1 to force an infinite number of iterations; defaults to -1.
* @return {Array<Object>} an array arr containing:
* -- arr[0] a solution x^* to the problem, a real number
* -- arr[1] the optimal value of the function f, f(x^*)
*
* @example
* goldenSectionSearch_(function (x) { return (x-2)*(x-2); }, 1, 5);
* // ~[2.00000028, 0]
*
*/
function goldenSectionSearch_(f, x_min, x_max, opt) {
	// Decode options
	if (opt === undefined) {
		opt = {};
	}
	
	// The maximum number of iterations of the algorithm.
	var maxIterations = opt.maxIter;
	if (maxIterations === undefined) {
		maxIterations = -1;
	}
	
	// The (absolute) tolerance value under which the algorithm
	// is considered to have converged.
	//
	// The default is taken to be 1e-6, which is a good numerical 
	// compromise since the golden section search method is linear.
	var eps = opt.eps;
	if (eps === undefined) {
		eps = 1e-6;
	}
	
	
	// Initializations
	var inv_phi = (Math.sqrt(5) - 1) / 2; // ~0.618
	var one_m_inv_phi = 1 - inv_phi; // ~0.382
	
	var a = x_min;
	var b = x_max;
	var c = a + one_m_inv_phi * (b - a);
	var d = a + inv_phi * (b - a);
	
	var f_c = f(c);
	var f_d = f(d);


	// Misc. checks
	if (x_min >= x_max) {
		throw new Error('bracketing interval lower bound ' + x_min + 
		                ' greater than bracketing interval upper bound ' + x_max);
	}

	
	// Core algorithm
	//
	// The function f is evaluated at points c and d above (with a < c < d < b),
	// and the subinterval [a,c], [c,d] or [d,b] in which to continue to search 
	// for the minimum of f is chosen based on the comparison between f(c) and f(d).
	//
	// The process then continues iteratively, until the chosen subinterval is of
	// length of at most eps.
	var iter = 0;	
	while (true) {
		// Check the number of iterations
		if (maxIterations !== -1 && iter > maxIterations) {
			throw new Error('maximum number of iterations reached: ' + maxIterations);
		}
				
		// Update the number of iterations
		++iter;

		// Compare f(c) and f(d) to select the next subinterval in
		// which to continue to search for the minimum of f.
		if (f_c < f_d) { // x^* belongs to [a, d]
			b = d;
			d = c;
			c = inv_phi*d + one_m_inv_phi*a;
	
			f_d = f_c;
			f_c = f(c);
		}
		else if (f_c > f_d) { // x^* belongs to [c, b]
			a = c;
			c = d;
			d = inv_phi*c + one_m_inv_phi*b;
			
			f_c = f_d;
			f_d = f(d);
		}
		else { // x^* belongs to [c, d], numerically highly improbable
			a = c;
			b = d;
			c = a + one_m_inv_phi * (b - a);
			d = a + inv_phi * (b - a);
			
			f_c = f(c);
			f_d = f(d);
		}

		// Stopping condition, based on the length of the bracketing interval
		if (Math.abs(b - a) <= eps * (Math.abs(c) + Math.abs(d)) ) {
			if (f_c < f_d) {
				return [c, f_c];
			}
			else {
				return [d, f_d];
			}
		}
	}
}

 
/**
* @function bisection_
*
* @summary Returns a solution to a unidimensional non-linear equation using the 
* bisection method.
*
* @description This function returns a solution to the equation f(x) = 0, where:
* - f: [x_min, x_max] -> R is a continuous function
* - f(x_min) and f(x_max) have opposite signs
*
* The algorithm used internally is the bisection method, c.f. the first and the second
* references, which is guaranteed to converge.
*
* To be noted that when there are several solutions to the equation f(x) = 0 on the
* interval [x_min, x_max], details on which solution can be found by the bisection method
* are available in the third reference.
*
* @see <a href="https://en.wikipedia.org/wiki/Bisection_method">Bisection method</a>
* @see William H. Press, Brian P. Flannery, Saul A. Teukolsky, William T. Vetterling, Numerical Recipes in C. The Art of Scientific Computing, 2nd Edition, 1992</a>
* @see <a href="https://www.jstor.org/stable/2029507">George Corliss, Which Root Does the Bisection Algorithm Find?, SIAM Review,Vol. 19, No. 2 (Apr., 1977), pp. 325-327</a>
*
* @param {function} f, a function representing the function f above, which must take as input argument
* a real number corresponding to a point in the interval [x_min, x_max] and which must return as output a real number 
* corresponding to f(x).
* @param {number} x_min, a real number corresponding to the lower bound of the interval on which 
* to search for a solution to the equation f(x) = 0, which must satisfy f(x_min) * f(x_max) < 0.
* @param {number} x_max, a real number corresponding to the upper bound of the interval on which 
* to search for a solution to the equation f(x) = 0, which must satisfy f(x_min) * f(x_max) < 0.
* @param {object} opt the optional parameters for the algorithm.
* @param {number} opt.eps the absolute tolerance for the convergence of the algorithm, a strictly positive real number; defaults to 1e-06.
* @param {number} opt.maxIter the maximum number of iterations of the algorithm, a strictly positive natural integer or -1 to force an infinite number of iterations; defaults to 45.
* @return {number} a solution to the problem, a real number
*
* @example
* bisection_(function (x) { return x*x - 2; }, 0, 2);
* // ~1.414
*
*/
function bisection_(f, x_min, x_max, opt) {
	// Decode options
	if (opt === undefined) {
		opt = {};
	}
	
	// The maximum number of iterations of the algorithm.
	//
	// The default is taken to be 45, because 45 bisections correspond to
	// a bracketing interval length of 2^-45 ~= 2.8e-14, which is more
	// than sufficient in standard numerical computations.
	var maxIterations = opt.maxIter;
	if (maxIterations === undefined) {
		maxIterations = 45;
	}
	
	// The (absolute) tolerance value under which the algorithm
	// is considered to have converged.
	//
	// The default is taken to be 1e-6, which is a good numerical 
	// compromise since the bisection method is linear.
	var eps = opt.eps;
	if (eps === undefined) {
		eps = 1e-6;
	}
	
	
	// Initializations
	var f_x_min = f(x_min);
	var f_x_max = f(x_max);
	var r; // a root of the function f in the interval [x_min, x_max]
	var dx; // the signed length of the interval [x_min, x_max], which will be halved in each iteration of the bisection algorithm
	if (f_x_min <= 0) { // by convention taken from the second reference, the bisection root search is oriented so that f(r) <= 0
		r = x_min;
		dx = x_max - x_min;
	}
	else {
		r = x_max;
		dx = x_min - x_max;
	}


	// Misc. checks
	if (x_min >= x_max) {
		throw new Error('bracketing interval lower bound ' + x_min + 
		                ' greater than bracketing interval upper bound ' + x_max);
	}
	if (f_x_min == 0) {
		return x_min; // a root has been found !
	}
	if (f_x_max == 0) {
		return x_max; // a root has been found !
	}
	if (f_x_min*f_x_max > 0.0) {
		throw new Error('interval [' + x_min + ',' + x_max + '] is not a bracketing interval');
	}
	
	
	// Core algorithm
	//
	// The bracketing interval [x_min, x_max] is iteratively
	// halved until a root r of the function f is found in a subinterval
	// of length at most eps.
	var iter = 0;	
	while (true) {
		// Check the number of iterations
		if (maxIterations !== -1 && iter > maxIterations) {
			throw new Error('maximum number of iterations reached: ' + maxIterations);
		}
				
		// Update the number of iterations
		++iter;
		
		// Halves the current bracketing interval
		dx = dx / 2;
		
		// Compute the mid point of the current bracketing interval,
		// as well as the value of f at this point.
		var x_mid = r + dx;
		var f_mid = f(x_mid);
		
		// Keep the orientation of the bisection root search so that f(r) <= 0
		if (f_mid <= 0) {
			r = x_mid;
		}
		
		// Early stopping condition, numerically highly improbable
		if (f_mid == 0) {
			return r;
		}

		// Stopping condition, based on the length of the bracketing interval
		if (Math.abs(dx) <= eps) {
			return r;
		}
	}
}


/**
* @function ccpsolveFISTA_
*
* @summary Returns a solution to a composite convex problem, 
* using a FISTA-like accelerated first-order algorithm.
*
* @description This function computes a solution to a composite convex
* problem using a FISTA-like accelerated first-order algorithm, c.f. the first reference.
*
* The composite convex problem to solve is assumed to be provided in the
* following format:
*
* min F(x) = f(x) + g(x), x in R^n
*
* where:
* - f: R^n -> R is a continuously differentiable convex function with a Lipschitz continuous gradient
* - g: R^n -> R u {+oo} is a (proximable) proper closed convex function
* - gradf: R^n -> R^n is the Lipschitz continuous gradient of f
* - proxg: R^n x R^+* -> R^n is the proximal operator associated to g defined as 
* - proxg(x, mu) = argmin u in R^n ( g(u) + 1/(2*mu) * ||u - x||_2^2 )
*
* The problem is assumed to be solvable, i.e., argmin F(x), x in R^n, is
* assumed to be non-empty.
*
* The algorithm used internally is based on the FISTA-BKTR algorithm of the third 
* reference, which is an optimal first-order method for a smooth problem (i.e., 
* it ensures a convergence rate of O(1/k^2)), with the following additions:
* - The usage of a convergence criterion based on the gradient of f and on a subdifferential of g,
* c.f. the fourth reference
* - The usage of both a fixed and of an adaptive restart mechanism, c.f. the fifth reference
* - The usage of a Barzilai and Borwein like step size, c.f. the sixth reference
*
* @see <a href="https://doi.org/10.1137/080716542">Amir Beck and Marc Teboulle, A Fast Iterative Shrinkage-Thresholding Algorithm for Linear Inverse Problems, SIAM Journal on Imaging Sciences 2009 2:1, 183-202</a>
* @see <a href="https://doi.org/10.1109/TIP.2009.2028250">A. Beck, M. Teboulle, "Fast gradient-based algorithms for constrained total variation image denoising and deblurring problems", IEEE Trans. Image Process., vol. 18, no. 11, pp. 2419-2434, 2009</a>
* @see <a href="https://doi.org/10.1007/s10208-014-9189-9">Scheinberg, K., Goldfarb, D. & Bai, X. Fast First-Order Methods for Composite Convex Optimization with Backtracking Found Comput Math (2014) 14: 389.</a>
* @see <a href="https://arxiv.org/abs/1411.3406">T. Goldstein, C. Studer, and R. G. Baraniuk, “A field guide to forward-backward splitting with a FASTA implementation,” Nov. 2014</a>
* @see <a href="https://doi.org/10.1137/16M1055323">Bo Wen, Xiaojun Chen, and Ting Kei Pong. Linear Convergence of Proximal Gradient Algorithm with Extrapolation for a Class of Nonconvex Nonsmooth Minimization Problems. SIAM Journal on Optimization 2017 27:1, 124-145</a>
* @see <a href="https://doi.org/10.1007/s10589-006-6446-0">Gradient Methods with Adaptive Step-Sizes. Zhou, B., Gao, L. & Dai, YH. Comput Optim Applic (2006) 35: 69.</a>
*
* @param {function} f, a function representing the function f above, which must take as input argument
* a n by 1 matrix x corresponding to a point in R^n and which must return as output a real number 
* corresponding to f(x).
* @param {function} gradf, a function representing the gradient of the function f above, 
* which must take as input argument a n by 1 matrix x corresponding to a point in R^n and 
* which must return as output a n by 1 matrix gradf(x) corresponding to gradf(x).
* @param {function} g, a function representing the function g above, which must take as input argument
* a n by 1 matrix x corresponding to a point in R^n and which must return as output a real number 
* or Number.POSITIVE_INFINITY corresponding to g(x).
* @param {function} proxg, a function representing the proximal operator associated to 
* the function g above, which must take as input arguments a n by 1 matrix x corresponding to 
* a point in R^n and a strictly positive real number mu corresponding to a step size and which 
* must return as output a n by 1 matrix corresponding to proxg(x, mu).
* @param {Matrix_} x0, an n by 1 matrix corresponding to the point on which to
* start the algorithm (usually, the best possible guess of the optimal solution).
* @param {object} opt the optional parameters for the algorithm.
* @param {number} opt.eps the absolute tolerance for the convergence of the algorithm, a strictly positive real number; defaults to 1e-04.
* @param {number} opt.maxIter the maximum number of iterations of the algorithm, a strictly positive natural integer or -1 to force an infinite number of iterations; defaults to 10000.
* @param {number} opt.maxLine the maximum number of line searches in one iteration of the algorithm, a strictly positive natural integer or -1 to force an infinite number of line searches; defaults to 100.
* @param {number} opt.beta the step size multiplicative shrinkage factor used in the backtracking procedure, a real number belonging to ]0,1[; defaults to 0.5.
* @param {number} opt.alphaMin the minimum value of the step size, a strictly positive real number; defaults to 1e-10.
* @param {number} opt.alphaMax the maximum value of the step size, a strictly positive real number; defaults to 1e10.
* @param {number} opt.restartPeriod the restart period, expressed in a number of iterations, of the fixed restart mechanism of the algorithm; defaults to 1000 iterations.
* @return {Array<Object>} an array arr containing two elements: 
* - arr[0] an n by 1 matrix containing the optimal solution x^* to the problem
* - arr[1] the optimal value of the function F, F(x^*)
*
* @example
* ccpsolveFISTA_(function(x) { return Math.exp((x.getValue(1, 1) - 0.7)*(x.getValue(1, 1) - 0.7)); }, // f(x) = exp((x - 0.7)^2)
*                function(x) { return new Matrix_([2 * (x.getValue(1, 1) - 0.7) * Math.exp((x.getValue(1, 1) - 0.7)*(x.getValue(1, 1) - 0.7))]); },  // gradf(x) = 2*(x - 0.7)*exp((x - 0.7)^2)
*				 function(x) { if (0 > x.getValue(1, 1) || x.getValue(1, 1) > 1) {
*				                   return Number.POSITIVE_INFINITY;
*			                   }
*			                   else {
*                                  return 0;
*	                           }
*			                 }, // g is the usual indicator function of a convex set, here [0,1]
*                function(x, mu) { return new Matrix_([Math.max(0, Math.min(x.getValue(1, 1), 1))]); }, // proxg(x, mu) = orthogonal projection of x on [0,1]
*                new Matrix_([0]) // the starting point of the algorithm
*               )
* // new Matrix_([~0.7])
*/
function ccpsolveFISTA_(f, gradf, g, proxg, x0, opt) {
	// Internal function to compute F(x) = f(x) + g(x), 
	// c.f. formula 1.1 of the third reference.
	function F(x) {
		return f(x) + g(x);
	}

	// Internal function to compute Q_mu(u,v) = f(v) + <u - v/gradf(v)> + 1/(2*mu) * ||u - v||_2^2 + g(u), 
	// c.f. formula 2.2 of the third reference.
	function Q(mu, u, v, gradf_v) {
		// Compute f(v)
		var f_v = f(v);

		// Compute u - v and ||u - v||_2
		var u_m_v = Matrix_.xmy(u, v);
		var u_m_v_two_norm = u_m_v.vectorNorm('two');
		
		// Compute g(u)
		var g_u = g(u);

		// Compute Q_mu
		var Q_mu_u_v = f_v + Matrix_.vectorDotProduct(u_m_v, gradf_v) + 1/(2 * mu) * u_m_v_two_norm * u_m_v_two_norm + g_u;
		
		// Return the computed value
		return Q_mu_u_v;
	}

	// Internal function to compute p_mu(v) = argmin_u Q_mu(u,v), 
	// c.f. formula 2.3 of the third reference.
	//
	// This function is shown to be equal to proxg(v - mu*gradf(v), mu)
	// in formula 3.13 of the second reference.
	function p(mu, v, gradf_v) {
		// Compute v - mu*gradf(v)
		var v_m_mu_gradf_v = Matrix_.axpby(1, v, -mu, gradf_v);
		
		// Compute p_mu
		var p_mu_v = Matrix_.copy(proxg(v_m_mu_gradf_v, mu));
		
		// Return both values
		return [v_m_mu_gradf_v, p_mu_v];
	}
	
	
    // ------
    
	// Decode options
	if (opt === undefined) {
		opt = {};
	}
	var eps = opt.eps || 1e-04;
	var maxIterations = opt.maxIter || 10000;
	var maxLineSearches = opt.maxLine || 100;
	var beta = opt.beta || 0.5;
	var alphaMin = opt.alphaMin || 1e-10;
	var alphaMax = opt.alphaMax || 1e10;
	var restartPeriod = opt.restartPeriod || 1000;
	
	
	// ------
	
	
	// Misc. initializations
	var n = x0.nbRows;
	var eps_tol = 1e-12; // used to numerically determine some conditions (backtrack, adaptative restart, stepsize)
	
	// Initializations, c.f. line 0 of the Algorithm 2 of the third reference			
	// Prediction parameter
	var t_km; 
	var t_k;

	// Theta parameter
	var theta_km;
	var theta_k;

	// Step size parameters
	var tau_k = 0.5;
	var mu_k_0 = alphaMin;
	
	// x iterates
	var x_k; // placeholder for the x_k vector
	var x_km; // placeholder for the x_k-1 vector
	var x_kmm; // placeholder for the x_k-2 vector
	var x_km_m_x_kmm; //  placeholder for the x_k-1 - x_k-2 vector
	var gradf_x_k = Matrix_.zeros(n, 1); // placeholder for the gradf(x_k) vector
	var gradf_x_km = Matrix_.zeros(n, 1);; // placeholder for the gradf(x_k-1) vector
	var gradf_x_kmm = Matrix_.zeros(n, 1);; // placeholder for the gradf(x_k-2) vector
	var gradf_x_km_m_gradf_x_kmm; // // placeholder for the gradf(x_k-1) - gradf(x_k-2) vector

	// y iterates
	var y_k = Matrix_.zeros(n, 1); // placeholder for the y_k vector
	var gradf_y_k = Matrix_.zeros(n, 1); // placeholder for the gradf(y_k) vector	
	
	
	// Main loop of the Algorithm 2 of the third reference,
	// guaranteed to converge per theorem 3.2 of the third reference.
	var restart = true; // a first initialization is needed at the first iteration 

	var iter = 0;	
	while (true) {
		// Check the number of iterations
		if (maxIterations !== -1 && iter > maxIterations) {
			throw new Error('maximum number of iterations reached: ' + maxIterations);
		}
		
		
		// Update the number of iterations
		++iter;
		
		
		// (-) Check the condition for a fixed restart of the algorithm, 
		// c.f. section 3.3 of the fifth reference.
		if (iter % restartPeriod === 0) {
			x0 = x_k;
			restart = true;
		}
		
		
		// (-) Restart of the algorithm as needed
		if (restart === true) {
			// Initialization of the prediction parameter
			t_km = 0; 
			t_k = 1;
			
			// Initialization of the theta parameter
			theta_km = 1;
			theta_k = null;
			
			// Initialization of the x iterates
			x_k = Matrix_.copy(x0);
			x_km = Matrix_.copy(x_k);
			x_kmm = Matrix_.copy(x_km);
			x_km_m_x_kmm = Matrix_.zeros(n, 1);
			gradf_x_k = Matrix_.copy(gradf(x_k), gradf_x_k);
			gradf_x_km = Matrix_.copy(gradf_x_k, gradf_x_km);
			gradf_x_kmm = Matrix_.copy(gradf_x_km, gradf_x_kmm);
			gradf_x_km_m_gradf_x_kmm = Matrix_.zeros(n, 1);

			// Initialization of the y iterates
			y_k = Matrix_.copy(x_k, y_k); 
			gradf_y_k = Matrix_.copy(gradf_x_k, gradf_y_k);
			
			// No update of the step size parameters, as the step size can take any value
			// per algorithm 2 of the third reference.
			
			// The restart is completed
			restart = false;
		}
		
		
		// (1) of the Algorithm 2 of the third reference
		// - Initialization of the initial stepsize for the current iteration
		var mu_k = mu_k_0;
		
		
		// (2) of the Algorithm 2 of the third reference
		// - Optimized backtracking line search
		var p_mu = p(mu_k, y_k, gradf_y_k);
		var y_k_m_mu_k_gradf_y_k = p_mu[0];
		var p_mu_k_y_k = p_mu[1];
		
		var iter_ls = 0;
		while ( F(p_mu_k_y_k) > Q(mu_k, p_mu_k_y_k, y_k, gradf_y_k) + eps_tol ) {
			// Check the number of iterations
			if (maxLineSearches !== -1 && iter_ls > maxLineSearches) {
				throw new Error('maximum number of line searches reached: ' + maxLineSearches + ' at iteration: ' + iter);
			}
			
			// Update the number of line search iterations
			++iter_ls;
			
			// Reduction in step size, and associated update of the theta_k parameter
			mu_k = beta * mu_k;
			theta_km = theta_km/beta;
			
			// Update of the current t_k and y_k iterates, due to the change in the theta_km
			// parameter.
			//
			// This is FistaStep(xk−1, xk−2, tk−1, θk−1)
			t_k = ( 1 + Math.sqrt(1 + 4*theta_km*t_km*t_km) ) / 2;
			y_k = Matrix_.axpby(1, x_km, (t_km - 1)/t_k, x_km_m_x_kmm, y_k);
			
			// Recomputation of gradf(y_k) and p_mu_k(y_k) for the next iteration
			//
			// The naive way to recompute gradf(y_k), i.e., computing the
			// gradient of f at point y_k can be improved by noticing
			// that the line search procedure do not update x_km and x_kmm,
			// c.f. the discussion after formula 3.17 of the third reference.
			gradf_y_k = Matrix_.axpby(1, gradf_x_km, (t_km - 1)/t_k, gradf_x_km_m_gradf_x_kmm, gradf_y_k);
			p_mu = p(mu_k, y_k, gradf_y_k);
			y_k_m_mu_k_gradf_y_k = p_mu[0];
			p_mu_k_y_k = p_mu[1];
		}
		
		
		// (3) of the Algorithm 2 of the third reference
		// - Computation of the x_k and t_k+1, y_k+1 iterates
		// - Computation of the initial stepsize for the next iteration
		// - Update of the theta_k parameter
		
		// Computation of the current x_k iterate
		x_k = p_mu_k_y_k;
		gradf_x_k = Matrix_.copy(gradf(x_k), gradf_x_k); // gradf(x_k)
		
		var x_k_m_x_km = Matrix_.xmy(x_k, x_km); // x_k - x_k-1
		var gradf_x_k_m_gradf_x_km = Matrix_.xmy(gradf_x_k, gradf_x_km); // gradf(x_k) - gradf(x_k-1)
		
		// Computation of the initial stepsize for the next iteration,
		// using a Barzilai and Borwein like stepsize, c.f. algorithm SS of the sixth reference.
		var s_k_d_s_k = Matrix_.vectorDotProduct(x_k_m_x_km, x_k_m_x_km); // <x_k - x_k-1/x_k - x_k-1>
		var z_k_d_z_k = Math.max(Matrix_.vectorDotProduct(gradf_x_k_m_gradf_x_km, gradf_x_k_m_gradf_x_km), // <gradf(x_k) - gradf(x_k-1)/gradf(x_k) - gradf(x_k-1)>
		                         eps_tol); // to avoid numerical issues in the division below
		var s_k_d_z_k = Matrix_.vectorDotProduct(x_k_m_x_km, gradf_x_k_m_gradf_x_km); // <x_k - x_k-1/gradf(x_k) - gradf(x_k-1)>

		if (s_k_d_z_k <= eps_tol) {
			mu_kp_0 = alphaMax;
		}
		else {
			var alpha_k_1 = Math.max(alphaMin, Math.min(s_k_d_s_k/s_k_d_z_k, alphaMax));
			var alpha_k_2 = Math.max(alphaMin, Math.min(s_k_d_z_k/z_k_d_z_k, alphaMax));
			
			if (alpha_k_2/alpha_k_1 <= tau_k) {
				mu_kp_0 = alpha_k_2;
				tau_k = 0.9 * tau_k;
			}
			else {
				mu_kp_0 = alpha_k_1;
				tau_k = 1.1 * tau_k;
			}
		}
		
		// Update of the theta_k parameter
		theta_k = mu_k/mu_kp_0;
		
		// Computation of the current t_k+1 and y_k+1 iterates,
		// plus misc. associated vectors.
		//
		// This is FistaStep(xk , xk−1, tk, θk)
		var t_kp = ( 1 + Math.sqrt(1 + 4*theta_k*t_k*t_k) ) / 2; // t_k+1
		var y_kp = Matrix_.axpby(1, x_k, (t_k - 1)/t_kp, x_k_m_x_km); // y_k+1	
		
		var gradf_y_kp = Matrix_.axpby(1, gradf_x_k, (t_k - 1)/t_kp, gradf_x_k_m_gradf_x_km); // gradf(y_k+1)


		// (-) Check the absolute convergence criteria (not in the third reference), 
		// c.f. paragraph 4.6 of the fourth reference
		var subgradg_x_k = Matrix_.axpby(1/mu_k, y_k_m_mu_k_gradf_y_k, -1/mu_k, x_k);
		var r_k = Matrix_.xpy(gradf_x_k, subgradg_x_k);
		if (r_k.vectorNorm('infinity') <= eps) {
			break;
		}
		
		
		// (-) Check the condition for an adaptative restart of the algorithm, 
		// c.f. section 3.3 of the fifth reference.
		var gs_k = Matrix_.vectorDotProduct(Matrix_.xmy(y_k, x_k), x_k_m_x_km);
		if (gs_k >= eps_tol) {
			x0 = x_k;
			restart = true;
		}

		
		// (-) Preparation of the next iteration:
		// Update of the step size
		mu_k_0 = mu_kp_0;
		
		// Update of the x_k iterates
		x_kmm = x_km;
		x_km = x_k;
		x_km_m_x_kmm = x_k_m_x_km;
		gradf_x_kmm = Matrix_.copy(gradf_x_km, gradf_x_kmm);
		gradf_x_km = Matrix_.copy(gradf_x_k, gradf_x_km);
		gradf_x_km_m_gradf_x_kmm = gradf_x_k_m_gradf_x_km;
		
		// Update of the y_k iterates
		y_k = Matrix_.copy(y_kp, y_k);
		gradf_y_k = Matrix_.copy(gradf_y_kp, gradf_y_k);
		
		// Update of the thera parameter
		theta_km = theta_k;
		
		// Update of the prediction parameters
		t_km = t_k;
		t_k = t_kp;
	}
	
	// Return the computed x_k value, as well as F(x_k)
	return [x_k, F(x_k)];
}


/**
* @function qksolveBS_
*
* @summary Returns an optimal solution to the continuous quadratic knapsack problem, 
* using a breakpoint searching algorithm.
*
* @description This function computes an optimal solution to the continuous quadratic
* knapsack problem using an O(n) breakpoint searching algorithm, c.f. the first reference.
*
* The problem to solve is assumed to be provided in the following format:
*
* min f(x) = 1/2 * <d*x/x> - <a/x>
*
* s.t. <b/x> = r (single linear equality constraint)
*      l <= x <= u (finite bound constraints)
*
* where:
* - d an n by 1 matrix with strictly positive elements, representing a diagonal n by n matrix with strictly positive elements
* - a an n by 1 matrix
* - r a real number
* - b an n by 1 matrix with strictly positive elements
* - l an n by 1 matrix
* - u an n by 1 matrix
* 
* To be noted that the algorithm used internally is able to detect the non-feasibility of the problem
* thanks to modifications based on the second reference, in which case an error is returned.
* 
* @see <a href="https://link.springer.com/article/10.1007/s10107-006-0050-z">Kiwiel, K.C., Breakpoint searching algorithms for the continuous quadratic knapsack problem, Math. Program. (2008) 112: 473</a>
* @see <a href="https://www.sciencedirect.com/science/article/pii/0167637784900105">Peter Brucker, An O(n) algorithm for quadratic knapsack problems, Operations Research Letters, Volume 3, Issue 3, 1984, Pages 163-166</a>
*
* @param {Matrix_} d an n by 1 matrix with strictly positive elements.
* @param {Matrix_} a an n by 1 matrix.
* @param {Matrix_} b an n by 1 matrix with strictly positive elements.
* @param {number} r a real number.
* @param {Matrix_} l an n by 1 matrix corresponding to the lower bounds constraints.
* @param {Matrix_} u an n by 1 matrix corresponding to the upper bounds constraints.
* @param {object} opt optional parameters for the algorithm.
* @param {number} opt.eps tolerance when assessing the numerical equality <b/x> = r , a strictly positive real number; defaults to 1e-16.
* @param {boolean} opt.outputLagrangeMultiplier boolean indicating if the Lagrange multiplier associated to the optimal solution of the problem 
* must be provided in output (true) or not (false); defaults to false.
* @return {Array<Object>} an array arr containing:
* - If opt.outputLagrangeMultiplier is set to false, two elements:
* -- arr[0] an n by 1 matrix containing the optimal solution x^* to the problem
* -- arr[1] the optimal value of the function, f(x^*)
*
* - If opt.outputLagrangeMultiplier is set to true, three elements:
* -- arr[0] an n by 1 matrix containing the optimal solution x^* to the problem
* -- arr[1] the optimal value of the function, f(x^*) 
* -- arr[2] the Lagrange multiplier associated to the equality constraint of the problem, t^*
*
* @example
* qksolveBS_(Matrix_([1, 1]), Matrix_([1, 1]), Matrix_([1, 1]), 1, Matrix_([0, 0]), Matrix_([1, 1])); // Compute the projection of the point [1,1] on the standard simplex of R^2
* // [Matrix_([0.5, 0.5]), -0.75]
*/
function qksolveBS_(d, a, b, r, l, u, opt) {
	// Internal function to resize an array.
	function resizeArray(arr, n) {
		if (arr instanceof Array) { // this restrict the size of the array to the first n elements
			arr.length = n; 
			return arr;
		}
		else if (arr instanceof Float64Array || arr instanceof Int32Array) { // this constructs a view on the first n array elements
			return arr.subarray(0, n);
		}
	}
	
	// Internal function to compute g(t) = <b/x(t)>, 
	// c.f. remark 3.2 b) of the first reference.
	function g(t) {
		// Compute g(t) using the formula 3.5 of the first reference.
		
		// Initialize g(t) with the right part of formula 3.5.
		var g_t = (p - t * q) + s;
		
		// Finalize the computation of g(t) by adding the left part of formula 3.5,
		// sum b_i * x_i(t), i belonging to the set of indices I.		
		var I_it = new I.iterator();
		var el = I_it.next();
		while (el != 0) {
			// Get the index belonging to the set I
			var i = el - 1;

			
			var x_i;
			if (t <= T_u[i]) {
				x_i = u.data[i];
			}
			else if (T_u[i] <= t && t <= T_l[i]) {
				x_i = (a.data[i] - t*b.data[i]) / d.data[i];
			}
			else if (T_l[i] <= t) {
				x_i = l.data[i];
			}
			
			g_t += b.data[i] * x_i;
			
			
			// Prepare the next iteration
			el = I_it.next();
		}
		
		// Return the value of g(t).
		return g_t;
	}
	
	// Internal function to compute the vector x(t).
	function x(t) {
		// Initialize x(t).
		var x_t = Matrix_.zeros(n, 1);
		
		// Compute x(t) component wise, using formula 2.6 of the first reference.
		for (var i = 0; i < n; ++i) {
			var x_i;
			if (t_star <= T_u[i]) {
				x_i = u.data[i];
			}
			else if (T_u[i] <= t_star && t_star <= T_l[i]) {
				x_i = (a.data[i] - t_star*b.data[i]) / d.data[i];
			}
			else if (T_l[i] <= t_star) {
				x_i = l.data[i];
			}
			x_t.data[i] = x_i;
		}
		
		// Return the value of x(t).
		return x_t;
	}
	
	
    // ------
    
	// Decode options
	if (opt === undefined) {
		opt = {};
	}
	var eps = opt.eps || 1e-16;
	var outputLagrangeMultiplier = false || opt.outputLagrangeMultiplier;
	

	// ------

	// Misc. checks
	if (!(d instanceof Matrix_) || !d.isVector()) {
		throw new Error('first input must be a vector');
	}
	if (!(a instanceof Matrix_) || !a.isVector()) {
		throw new Error('second input must be a vector');
	}
	if (!(b instanceof Matrix_) || !b.isVector()) {
		throw new Error('third input must be a vector');
	}
	if (!(l instanceof Matrix_) || !l.isVector()) {
		throw new Error('fifth input must be a vector');
	}
	if (!(u instanceof Matrix_) || !u.isVector()) {
		throw new Error('sixth input must be a vector');
	}
	
	if (d.nbRows !== a.nbRows) {
		throw new Error('first and second inputs number of rows do not match: ' + d.nbRows + '-' + a.nbRows);
	}
	if (d.nbRows !== b.nbRows) {
		throw new Error('first and third inputs number of rows do not match: ' + d.nbRows + '-' + b.nbRows);
	}
	if (d.nbRows !== l.nbRows) {
		throw new Error('first and fifth inputs number of rows do not match: ' + d.nbRows + '-' + l.nbRows);
	}
	if (d.nbRows !== u.nbRows) {
		throw new Error('first and sixth inputs number of rows do not match: ' + d.nbRows + '-' + u.nbRows);
	}


	// ------
	
	// Initializations    
	var n = b.nbRows;
	
	var abs_r = Math.abs(r);
	
	var T = typeof Float64Array === 'function' ? new Float64Array(2*n) : new Array(2*n); // the set of breakpoints T
	var T_l = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n); // the list of breakpoints t_l_i, i=1..n
	var T_u = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n); // the list of breakpoints t_u_i, i=1...n
	
	var I = new BitSet_().setRange(1, n); // the set of indices I
	var p = 0;
	var q = 0;
	var s = 0;
	
	
	// ------
	
	// Computation of the breakpoints t_l_i and t_u_i, i = 1..n, c.f. formula 2.5 of the first reference.
	// 
	// In parallel:
	// - Computation of t_1 and t_r, c.f. formula 7 of the second reference.
	// - Basic checks on the problem constraints.
	var t_1 = Infinity;
	var t_r = -Infinity;
	for (var i = 0, j = 0; i < n; ++i) {
		// Check on lower and upper bounds l_i and u_i
		if (l.data[i] > u.data[i]) {
			throw new Error('infeasible problem detected');
		}
		
		// Check the strict positivity of b_i
		if (b.data[i] <= 0) {
			throw new Error('negative element detected in b');
		}

		// Check the strict positivity of d_i
		if (d.data[i] <= 0) {
			throw new Error('negative element detected in d');
		}		
	
		// Computation of t_l_i
		var t_l_i = (a.data[i] - l.data[i]*d.data[i]) / b.data[i];
		T_l[i] = t_l_i;
		T[j++] = t_l_i;
		
		// Computation of t_u_i
		var t_u_i = (a.data[i] - u.data[i]*d.data[i]) / b.data[i];
		T_u[i] = t_u_i;
		T[j++] = t_u_i;

		// Potential update of t_1 and t_r
		//
		// To be noted that as t_u_i <= t_l_i, i=1..n:
		// - t_1 is necessarily found amongst t_u_i, i=1..n
		// - t_r is necessarily found amongst t_l_i, i=1..n
		if (t_l_i > t_r) {
			t_r = t_l_i;
		}
		if (t_u_i < t_1) {
			t_1 = t_u_i;
		}	
	}

	// Check the feasibility of the problem , c.f. line 2 of the 
	// algorithm of the second reference.
	var g_t_1 = g(t_1);
	var g_t_r = g(t_r);
	if (g_t_1 < r || g_t_r > r) {
		throw new Error('infeasible problem detected');
	}

	// If the problem is feasible, it admits a unique solution x(t^*), and the problem
	// is then to compute t^*, c.f. the theorem of the second reference.
	var t_star = null;

	// Check if t_1 or t_r is optimal, in which case the algorithm can be stopped, c.f.
	// line 1 of the algorithm of the second reference.	
	if (Math.abs(g_t_1 - r) <= eps * abs_r) {
		t_star = t_1;
	}
	else if (Math.abs(g_t_1 - r) <= eps * abs_r) {
		t_star = t_r;
	}
	// Otherwise, proceed with the core algorithm 3.1 of the first reference.
	else {
		// Step 0: initializations, with some initializations already done.
		var t_l = t_1; // t_1 was already computed to check feasibility, so there is no need to use t_0
		var t_u = t_r; // t_r was already computed to check feasibility, so there is no need to use t_rp

		while (T.length != 0) {
			// Step 1: Breakpoint selection
			// 
			// This step uses the SELECT algorithm of Floyd and Rivest to compute the median,
			// with added benefit for steps 4 and 5 below that this algorithm partition the array T 
			// with the elements lower than the median at the left of the median position and the 
			// elements greater than the median at the right of the median position.
			var median_indice = Math.ceil(T.length/2);
			var t_hat = select_(T, median_indice);

			// Step 2: Computing g(t^)
			var g_t_hat = g(t_hat);

			// Step 3: Optimality check
			if (Math.abs(g_t_hat - r) <= eps * abs_r) {
				t_star = t_hat;
				break;
			}
			
			// Step 4: Lower breakpoint removal
			else if (g_t_hat > r) {
				t_l = t_hat;

				// Update T, with T = {t in T : t^ < t}.
				//
				// Thanks to the SELECT algorithm used to compute the median
				// of T, updating T simply means extracting the elements T.length/2...T.length
				var j = 0;
				for (var i = median_indice; i < T.length; ++i) {
					T[j++] = T[i];
				}
				T = resizeArray(T, j);
			}

			// Step 5: Upper breakpoint removal
			else if (g_t_hat < r) {
				t_u = t_hat;
				
				// Update T, with T = {t in T : t < t^}.
				//
				// Thanks to the SELECT algorithm used to compute the median
				// of T, updating T simply means extracting the elements 0...T.length/2
				T = resizeArray(T, median_indice - 1);

			}
			
			// Step 6: 
			// - Update of I, p, q and s following the formula 3.8 of the first reference
			//
			// The elements of I which are kept after all the iterations below are copied
			// at the beginning of the array I, and the array I is resized to the number
			// of kept elements.		
			var I_it = new I.iterator();
			var el = I_it.next();
			while (el != 0) {
				// Get the index belonging to the set I
				var i = el - 1;
				var remove_i = false;
				
				if (T_l[i] <= t_l) {
					s += b.data[i] * l.data[i];

					remove_i = true;
				}
				if (t_u <= T_u[i]) {
					s += b.data[i] * u.data[i];

					remove_i = true;
				}
				if (T_u[i] <= t_l && t_u <= T_l[i]) {
					var b_d = b.data[i] / d.data[i];
					p += a.data[i] * b_d;
					q += b.data[i] * b_d;

					remove_i = true;
				}
				
				if (remove_i === true) {
					I.unset(i+1);
				}
				
				// Prepare the next iteration
				el = I_it.next();
			}
		}

		// Step 6: 
		// - Stopping criterion: test on the size of T
		if (T.length == 0) {
			t_star = (p + s - r) / q;
		}
	}

	// Now that t^* has been computed, the last step is to compute the optimal
	// solution of the problem, x^* = x(t^*), c.f. remark 3.2 d) of the first reference.
	var x_star = x(t_star);
	
	// Compute the optimal function value f(x^*).
	var fctVal = 1/2 * Matrix_.vectorDotProduct(x_star, Matrix_.elementwiseProduct(x_star, d)) - Matrix_.vectorDotProduct(a, x_star);
	
	// Return the computed solution.
	if (outputLagrangeMultiplier === true) {
		return [x_star, fctVal, t_star];
	}
	else {
		return [x_star, fctVal];
	}
}
 
 
/**
* @function qpsolveGSMO_
*
* @summary Returns an optimal solution to a quadratic program with a single linear constraint
* and finite bound constraints, using a generalized sequential minimization optimization algorithm.
*
* @description This function computes an optimal solution to a quadratic program
* with a single linear constraint and finite bound constraints using a GSMO algorithm, 
* c.f. the first reference.
*
* The quadratic program to solve is assumed to be provided in the following format:
*
* min f(x) = 1/2 * <Q*x/x> + <p/x>
*
* s.t. <b/x> = r (single linear equality constraint)
*      l <= x <= u (bound constraints)
*
* with:
* - Q an n by n square symmetric positive semi-definite matrix
* - p an n by 1 matrix
* - r a real number
* - b an n by 1 matrix with strictly positive elements
* - l an n by 1 matrix
* - u an n by 1 matrix
* 
* To be noted that the algorithm used internally requires that the feasible set F of this quadratic program is non empty
* and that f is bounded below on F to converge (i.e., admit a finite optimal solution).
*
* Since the feasible set, if non empty, is bounded by definition, the main assumption 
* is then that the feasible set is non-empty (i.e., that the problem is feasible), 
* and if this is not the case, an error is returned.
*
* @see <a href="https://link.springer.com/article/10.1023/A:1012431217818">Keerthi, S. & Gilbert, E. Convergence of a Generalized SMO Algorithm for SVM Classifier Design Machine Learning (2002) 46: 351.</a>
* @see <a href="http://ieeexplore.ieee.org/document/6789464/">S. S. Keerthi, S. K. Shevade, C. Bhattacharyya and K. R. K. Murthy, "Improvements to Platt's SMO Algorithm for SVM Classifier Design," in Neural Computation, vol. 13, no. 3, pp. 637-649, March 1 2001.</a>
* @see <a href="https://www.ncbi.nlm.nih.gov/pubmed/15941003">Takahashi N, Nishi T., Rigorous proof of termination of SMO algorithm for support vector machines., IEEE Trans Neural Netw. 2005 May;16(3):774-6.</a>
*
* @param {Matrix_} Q a square symmetric positive semi-definite n by n matrix.
* @param {Matrix_} p an n by 1 matrix.
* @param {Matrix_} b an n by 1 matrix with strictly positive elements.
* @param {number} r a real number.
* @param {Matrix_} l an n by 1 matrix.
* @param {Matrix_} u an n by 1 matrix.
* @param {object} opt optional parameters for the algorithm.
* @param {number} opt.eps tolerance for the convergence of the algorithm, a strictly positive real number; defaults to 1e-04.
* @param {number} opt.maxIter maximum number of iterations of the algorithm, a strictly positive natural integer or -1 to force an infinite number of iterations; defaults to 10000.
* @return {Array<Object>} an array arr containing two elements: 
* - arr[0] an n by 1 matrix containing the optimal solution x^* (in case Q is positive definite) 
* or an optimal solution x^* (in case Q is positive semi-definite) to the quadratic program
* - arr[1] the optimal value of the function f, i.e. f(x^*)
*
* @example
* qpsolveGSMO_(Matrix_([[2, 1], [1, 1]]), Matrix_([0, 0]), Matrix_([1, 1]), 1, Matrix_([0, 0]), Matrix_([1, 1])); // Solves min x^2 + xy + y^2/2 on the unit simplex of R^2
* // [Matrix_([0, 1]), 0.5]
*/
 function qpsolveGSMO_(Q, p, b, r, l, u, opt) {
    // ------
    
	// Decode options
	if (opt === undefined) {
		opt = {};
	}
	var eps = opt.eps || 1e-04;
	var maxIterations = opt.maxIter || 10000;
	
	
	// ------

	// Misc. checks
	if (!(Q instanceof Matrix_) || !Q.isSquare()) {
		throw new Error('first input must be a square matrix');
	}
	if (!(p instanceof Matrix_) || !p.isVector()) {
		throw new Error('second input must be a vector');
	}
	if (!(b instanceof Matrix_) || !b.isVector()) {
		throw new Error('third input must be a vector');
	}
	if (!(l instanceof Matrix_) || !l.isVector()) {
		throw new Error('fifth input must be a vector');
	}
	if (!(u instanceof Matrix_) || !u.isVector()) {
		throw new Error('sixth input must be a vector');
	}
	
	if (Q.nbRows !== p.nbRows) {
		throw new Error('first and second inputs number of rows do not match: ' + Q.nbRows + '-' + a.nbRows);
	}
	if (Q.nbRows !== b.nbRows) {
		throw new Error('first and third inputs number of rows do not match: ' + Q.nbRows + '-' + b.nbRows);
	}
	if (Q.nbRows !== l.nbRows) {
		throw new Error('first and fifth inputs number of rows do not match: ' + Q.nbRows + '-' + l.nbRows);
	}
	if (Q.nbRows !== u.nbRows) {
		throw new Error('first and sixth inputs number of rows do not match: ' + Q.nbRows + '-' + u.nbRows);
	}

	
	// ------
	
	// Initializations
	var n = Q.nbRows;

	
	// ------
	
	// Implementation of the algorithm GSMO of the first reference,
	// with some implementation details provided in the second reference.
	
	// Compute a feasible initial point x.
	//
	// This is done below by projecting the "centroid" vector
	// r/n * (1/b_1,...,1/b_n) on the constraints set, which is an O(n)
	// operation.
	var centroid = Matrix_.fill(n, 1, 
								function(i,j) { 
									return r/n* 1/b.data[i-1];
								});
	var p_centroid = qksolveBS_(Matrix_.ones(n, 1), centroid, b, r, l, u);
	var x = p_centroid[0];
	
	// Compute the gradient of the function f at the point x, using formula
	// grad(f)(x) = Q*x + p.
	//
	// This step is the most expensive code portion, since matrix-vector
	// multiplication is O(n^2).
	var grad_f_x = Matrix_.xpy(Matrix_.xy(Q, x), p);
	
	// Main loop of the GSMO algorithm, which convergence is guaranteed
	// by theorem 1 of the first reference and by theorem 1 of the
	// third reference.
	var iter = 0;
	while (true) {
		// Check the number of iterations
		if (maxIterations !== -1 && iter >= maxIterations) {
			throw new Error('maximum number of iterations reached: ' + maxIterations);
		}

		// Update the number of iterations
		++iter;
		
		// Choose (i,j) a pair of indices such that (i,j) = (i_up,i_low) is 
		// the most violating pair on the sets I_up and I_low, c.f. formulas
		// 5.1a and 5.1b of the second reference:
		// - i_low is the indice such that F_i_low = max {F_i, i belonging to I_low}
		// - i_up is the indice such that F_i_up = min {F_i, i belonging to I_up}
		//
		// with:
		// - I_low = I_0 u I_3 u I_4
		// - I_up = I_0 u I_1 u I_2
		// - I_0 = {i, l(i) < x(i) < u(i)}
		// - I_1 = {i, b(i) > 0, x(i) = l(i)}
		// - I_2 = {i, b(i) < 0, x(i) = u(i)}, empty here as b > 0
		// - I_3 = {i, b(i) > 0, x(i) = u(i)}
		// - I_4 = {i, b(i) < 0, x(i) = l(i)}, empty here as b > 0
		//
		// This choice corresponds to the method 2 described at the point 5 
		// of the section 5 of the second reference, with no optimization 
		// to compute (i,j) first on set I_0 and only then on the sets I_up and I_low.
		//
		// To be noted that the first reference does not describe this particular 
		// choice in details, because the GSMO algorithm described is more generic.
		var i_low = -1;
		var F_i_low = -Infinity;
		var i_up = -1;
		var F_i_up = Infinity;
		for (var i = 0; i < n; ++i) {
			// Compute F_i, c.f. formula 1 of the first reference.
			F_i = grad_f_x.data[i] / b.data[i];
			
			// If i belongs to I_0, both i_low and i_up can potentially be updated.
			if (l.data[i] < x.data[i] && x.data[i] < u.data[i]) {
				if (F_i > F_i_low) {
					F_i_low = F_i;
					i_low = i;
				}
				if (F_i < F_i_up) {
					F_i_up = F_i;
					i_up = i;
				}
			}
			// If i belongs to I_1, only i_up can potentially be updated.
			else if (x.data[i] == l.data[i]) {
				if (F_i < F_i_up) {
					F_i_up = F_i;
					i_up = i;
				}		
			}
			// If i belongs to I_3, only i_low can potentially be updated.
			else if (x.data[i] == u.data[i]) {
				if (F_i > F_i_low) {
					F_i_low = F_i;
					i_low = i;
				}		
			}
		}
		
		// Stopping condition: check the formula 6 of the first reference:
		// min {F_i, i belonging to I_up} >= max {F_i, i belonging to I_low} - eps,
		// which is equivalent by definition to checking F_i_low >= F_i_up - eps.
		if (F_i_low - F_i_up <= eps) {
			break;
		}
		
		// Minimization of the function f on the rectangle [l(i), u(i)] x [l(j), u(j)] 
		// while varying only the coordinates (i,j) of the point x, with
		// i = i_up and j = i_low per choice of the (i,j) indices above.
		// 
		// From the section 3 of the first reference, this problem is equivalent 
		// to minimizing a function phi(t) = phi(0) + phi'(0)*t + phi''(0)*t^2/2
		// with:
		// - phi(0) irrelevant for the analysis
		// - phi'(0) = F_i - F_j
		// - phi''(0) = Q(i,i)/b(i)^2 + Q(j,j)/b(j)^2 -2*Q(i,j)/(b(i)*b(j))
		// - t_min <= t <= t_max, with t_min and t_max determined such that
		// l(i) <= x(i) + t/b(i) <= u(i) and l(j) <= x(j) - t/b(j) <= u(j),
		// that is:
		// - t_min = max( (l(i) - x(i))*b(i) , (x(j) - u(j))*b(j) )
		// - t_max = min( (u(i) - x(i))*b(i) , (x(j) - l(j))*b(j) )
		//
		// As the matrix Q is supposed to be positive semi-definite, there are 
		// only two possibilities:
		// - phi''(0) > 0, in which case phi is a second order polynomial with a strictly
		// positive leading coefficient. The unconstrained minimum of phi is then reached 
		// at t^* = -phi'(0)/phi''(0), and the constrained minimum of phi is then reached at
		// max(t_min, min(t^*, t_max)).
		//
		// - phi''(0) = 0, in which case phi is a linear function. Since phi'(0) <> 0 
		// per selection of the pair (i,j) = (i_low,i_up), phi is not constant. The
		// minimum of phi is then reached at t^* = t_min if phi'(0) > 0, or at t^* = t_max
		// if phi'(0) < 0.
		var i = i_up;
		var j = i_low;
		
		// Compute t_min
		var t_min_l_i = (l.data[i] - x.data[i])*b.data[i];
		var t_min_u_j = (x.data[j] - u.data[j])*b.data[j];
		var t_min = t_min_l_i >= t_min_u_j ? t_min_l_i : t_min_u_j;

		// Compute t_max
		var t_max_u_i = (u.data[i] - x.data[i])*b.data[i];
		var t_max_l_j = (x.data[j] - l.data[j])*b.data[j];
		var t_max = t_max_u_i <= t_max_l_j ? t_max_u_i : t_max_l_j;
		
		// Compute t^*
		var dphi_0 = F_i_up - F_i_low;
		var ddphi_0 = Q.data[i*Q.nbColumns + i]/(b.data[i] * b.data[i]) + Q.data[j*Q.nbColumns + j]/(b.data[j] * b.data[j]) - 2*Q.data[i * Q.nbColumns + j]/(b.data[i] * b.data[j]);
		var t_star;
		if (ddphi_0 > 0) { // phi''(0) > 0
			t_star = -dphi_0/ddphi_0;
			if (t_star > t_max) {
				t_star = t_max;
			}
			else if (t_star < t_min) {
				t_star = t_min;
			}
		}
		else { // phi''(0) = 0, as phi''(0) < 0 would imply Q is not positive semi-definite
			if (dphi_0 > 0) {
				t_star = t_min;
			}
			else {
				t_star = t_max;
			}
		}
		
		// Once t^* minimizing phi on [t_min,t_max] has been computed,
		// the point x can be updated using the parametric values of its (i,j) coordinates,
		// c.f. section 3 of the first reference:
		// - x(i)_new = x(i)_old + t^*/b(i) 
		// - x(j)_new  = x(j)_old - t^*/b(j)
		//
		// Nevertheless, to avoid loss of numerical precision when either x(i) or x(j) reaches one
		// of its boundaries, a specific logic is implemented below to make sure both x(i) and x(j)
		// stay feasible.
		var old_x_i = x.data[i];
		var old_x_j = x.data[j];
		var delta_x_i = t_star/b.data[i];
		var delta_x_j = -t_star/b.data[j];		
		x.data[i] += delta_x_i;
		x.data[j] += delta_x_j;
		
		// Specific process in case of boundaries crossing.
		//
		// Note that there is no if/else below because it might happen that t_min == t_max
		// and/or that t_min_l_i == t_min_u_j and/or ...
		if (t_star == t_min) {
			if (t_min == t_min_l_i) {
				x.data[i] = l.data[i];
				delta_x_i = x.data[i] - old_x_i;
				// No numerical update for x(j), because if it has not reached a boundary, it is strictly within [l(j), u(j)]
			}
			if (t_min == t_min_u_j) {
				x.data[j] = u.data[j];
				delta_x_j = x.data[j] - old_x_j;
				// No numerical update for x(i), because if it has not reached a boundary, it is strictly within [l(i), u(i)]
			}
		}
		if (t_star == t_max) {
			if (t_max == t_max_u_i) {
				x.data[i] = u.data[i];
				delta_x_i = x.data[i] - old_x_i;
				// No numerical update for x(j), etc.
			}
			if (t_max == t_max_l_j) {
				x.data[j] = l.data[j];
				delta_x_j = x.data[j] - old_x_j;
				// No numerical update for x(i), etc.
			}		
		}		
		
		// Compute the gradient of the function f at the updated point x.
		//
		// To be noted that since the updated point x is different from the previous point x
		// by only its (i,j) coordinates, this gradient can be computed using the formula:
		// grad_f_x_new = Q*x_new + p 
		//              = Q*(x_old + (0...t^*/b(i)...0...-t^*/b(j)...0)^t) + p
		//              = Q*x_old + p + Q*(0...t^*/b(i)...0...-t^*/b(j)...0)^t
		//              = grad_f_x_old + (Q(1,i)*t^*/b(i) - Q(1,j)*t^*/b(j), ..., Q(n,i)*t^*/b(i) - Q(n,j)*t^*/b(j))
		for (var k = 0; k < n; ++k) {
			grad_f_x.data[k] = grad_f_x.data[k] + Q.data[k*Q.nbColumns + i]*delta_x_i + Q.data[k*Q.nbColumns + j]*delta_x_j;
		}
	}
	
	// Compute the optimal function value f(x^*).
	//
	// This step is also the most expansive code portion, since matrix-vector
	// multiplication is O(n^2).
	var fctVal = 1/2 * Matrix_.vectorDotProduct(x, Matrix_.xy(Q, x)) + Matrix_.vectorDotProduct(p, x);
	
	// Return the computed solution.
	return [x, fctVal];
}

/**
* @function lpsolvePDHG_
*
* @summary Returns an optimal solution to a linear program, using a primal-dual hybrid gradient algorithm.
*
* @description This function computes an optimal solution to a linear program using a 
* preconditioned primal-dual hybrid gradient (PDHG) algorithm, c.f. the first reference.
*
* The linear program to solve is assumed to be provided in the following format:
*
* min f(x) = <c/x>
*
* s.t. Ae*x = be (equality constraints)
*      Ai*x <= bi (inequality constraints)
*      lb <= x <= ub (bound constraints)
*
* with:
* - c an n by 1 matrix
* - Ae an optional me by n matrix
* - be an optional me by 1 matrix
* - Ai an optional mi by n matrix
* - bi an optional mi by 1 matrix
* - lb an optional n by 1 matrix, which can contain negative infinity values (-Infinity) corresponding to unbounded variables on the negative axis
* - ub an optional n by 1 matrix, which can contain positive infinity values (Infinity) corresponding to unbounded variables on the positive axis
*
* and with:
* - lb assumed to be an n by 1 matrix made of zeroes if not provided
* - ub assumed to be an n by 1 matrix made of positive infinity values if not provided
* 
* To be noted that the algorithm used internally requires the linear problem to be feasible and bounded to converge
* (i.e., admit a finite optimal solution).
* 
* @see <a href="http://ieeexplore.ieee.org/document/6126441/">T. Pock and A. Chambolle, "Diagonal preconditioning for first order primal-dual algorithms in convex optimization" 2011 International Conference on Computer Vision, Barcelona, 2011, pp. 1762-1769.</a>
* @see <a href="https://arxiv.org/abs/1305.0546">Tom Goldstein, Min Li, Xiaoming Yuan, Ernie Esser, Richard Baraniuk, "Adaptive Primal-Dual Hybrid Gradient Methods forSaddle-Point Problems", 05/2013, eprint arXiv:1305.0546</a>
* @see <a href="http://www.numerical.rl.ac.uk/reports/drRAL2001034.pdf">D. Ruiz ,A scaling algorithm to equilibrate both rows and column norms in matrices, Tech.Report RT/APO/01/4, ENSEEIHT-IRIT, 2001.</a>
*
* @param {Matrix_} Ae an optional me by n matrix; must be null if not provided.
* @param {Matrix_} be an optional me by 1 matrix; must be null if not provided.
* @param {Matrix_} Ai an optional mi by n matrix; must be null if not provided.
* @param {Matrix_} bi an optional mi by 1 matrix; must be null if not provided.
* @param {Matrix_} c an n by n matrix.
* @param {Matrix_} lb an optional n by 1 matrix; must be null if not provided.
* @param {Matrix_} ub an optional n by 1 matrix; must be null if not provided.
* @param {object} opt optional parameters for the algorithm.
* @param {number} opt.eps tolerance for the convergence of the algorithm, a strictly positive real number; defaults to 1e-08.
* @param {number} opt.maxIter maximum number of iterations of the algorithm, a strictly positive natural integer or -1 to force an infinite number of iterations; defaults to 100000.
* @return {Array<Object>} an array arr containing two elements: 
* - arr[0] an n by 1 matrix containing the optimal solution x^* to the linear program
* - arr[1] the optimal value of the function f, i.e. f(x^*)
*
* @example
* lpsolvePDHG_(Matrix_([[1, 1]]), Matrix_([1]), null, null, Matrix_([1, 2]), null, null); // Solves min x + 2*y on the unit simplex of R^2
* // [Matrix_([~1, ~0]), ~1]
*/
 function lpsolvePDHG_(Ae, be, Ai, bi, c, lb, ub, opt) {
    // ------
    
	// Decode options
	if (opt === undefined) {
		opt = {};
	}
	var eps = opt.eps || 1e-08;
	var maxIterations = opt.maxIter || 100000;
	

	// ------

	// Misc. checks
	var eqContraints = false;
	var ineqContraints = false;
	var boundContraints = false;
	
	if (Ae !== null && be !== null) {
		eqContraints = true;
	}
	else if (Ae !== null && be === null) {
		throw new Error('equality constraints vector is missing');
	}
	else if (Ae === null && be !== null) {
		throw new Error('equality constraints matrix is missing');
	}

	if (Ai !== null && bi !== null) {
		ineqContraints = true;
	}
	else if (Ai !== null && bi === null) {
		throw new Error('inequality constraints vector is missing');
	}
	else if (Ai === null && bi !== null) {
		throw new Error('inequality constraints matrix is missing');
	}
	
	if (lb !== null && ub !== null) {
	    boundContraints = true;
	}
	else if (lb !== null && ub === null ) {
    	throw new Error('upper bounds constraints vector is missing');
	}
	else if (lb === null && ub !== null ) {
    	throw new Error('lower bounds constraints vector is missing');
	}
	
	if (!(c instanceof Matrix_)) {
		throw new Error('fifth input must be a matrix');
	}
	if (c.nbColumns !== 1) {
		throw new Error('fifth input is not a vector: ' + c.nbColumns + '-' + c.nbRows);
	}
	
	if (eqContraints) {
		if (!(Ae instanceof Matrix_)) {
			throw new Error('first input must be a matrix');
		}
		if (!(be instanceof Matrix_)) {
			throw new Error('second input must be a matrix');
		}
		if (Ae.nbRows !== be.nbRows) {
			throw new Error('first and second inputs number of rows do not match: ' + Ae.nbRows + '-' + be.nbRows);
		}
		if (Ae.nbColumns !== c.nbRows) {
			throw new Error('first input number of columns and fifth input number of rows do not match: ' + Ae.nbColumns + '-' + c.nbRows);
		}
		if (be.nbColumns !== 1) {
			throw new Error('second input is not a vector: ' + be.nbColumns + '-' + be.nbRows);
		}
	}
	
	if (ineqContraints) {
		if (!(Ai instanceof Matrix_)) {
			throw new Error('third input must be a matrix');
		}
		if (!(bi instanceof Matrix_)) {
			throw new Error('third input must be a matrix');
		}
		if (Ai.nbRows !== bi.nbRows) {
			throw new Error('third and fourth inputs number of rows do not match: ' + Ai.nbRows + '-' + bi.nbRows);
		}
		if (Ai.nbColumns !== c.nbRows) {
			throw new Error('third input number of columns and fifth input number of rows do not match: ' + Ai.nbColumns + '-' + c.nbRows);
		}
		if (bi.nbColumns !== 1) {
			throw new Error('fourth input is not a vector: ' + bi.nbColumns + '-' + bi.nbRows);
		}
	}
	
	if (boundContraints) {
		if (lb.nbRows !== null) {
			if (!(lb instanceof Matrix_)) {
				throw new Error('sixth input must be a matrix');
			}
			if (lb.nbRows !== c.nbRows) {
				throw new Error('sixth input number of rows and fifth input number of rows do not match: ' + lb.nbRows + '-' + c.nbRows);
			}
		}
        if (ub.nbRows !== null) {
			if (!(ub instanceof Matrix_)) {
				throw new Error('seventh input must be a matrix');
			}
			if (ub.nbRows !== c.nbRows) {
				throw new Error('seventh input number of rows and fifth input number of rows do not match: ' + ub.nbRows + '-' + c.nbRows);
			}
		}
	}

	
	// ------
	
	// Initializations
	// Constraints
	var me = 0;
	var ye_k = null;
	var ye_kp = null;
	var res_ye_kp_ye_k = null;
	if (eqContraints) {
	    me = Ae.nbRows; // the number of equality constaints
    	ye_k = Matrix_.zeros(me, 1); // the dual iterate ye_k
    	ye_kp = Matrix_.zeros(me, 1); // the dual iterate ye_k+1
    	res_ye_kp_ye_k = Matrix_.zeros(me, 1); // the residual ye_kp - ye_k
	}
	var mi = 0;
	var yi_k = null;
	var yi_kp = null;
	var res_yi_kp_yi_k = null;
	if (ineqContraints) {
	    mi = Ai.nbRows; // the number of inequality (<=) constaints
    	yi_k = Matrix_.zeros(mi, 1); // the dual iterate yi_k
    	yi_kp = Matrix_.zeros(mi, 1); // the dual iterate yi_k+1
    	res_yi_kp_yi_k = Matrix_.zeros(mi, 1); // the residual yi_kp - yi_k
	}
	var m = me + mi; // the total number of constraints
	
    // Variables
    var n = c.nbRows;
	var x_k = Matrix_.ones(n, 1); // the primal iterate x_k
	var x_kp = Matrix_.ones(n, 1); // the primal iterate x_k+1
	var z_k = Matrix_.ones(n, 1); // the relaxed iterate z_k = 2*x_k+1 - x_k
	var res_x_kp_x_k = Matrix_.zeros(n, 1); // the residual x_kp - x_k

    // Misc.
	var tmp_vec_n = Matrix_.zeros(n, 1); // a temporary placeholder vector of dimension n
	var ttmp_vec_n = Matrix_.zeros(n, 1); // a temporary placeholder vector of dimension n
	var tmp_vec_me = null;
	if (eqContraints) {
		tmp_vec_me = Matrix_.zeros(me, 1); // a temporary placeholder vector of dimension me
	}
	var tmp_vec_mi = null;
	if (ineqContraints) {
		tmp_vec_mi = Matrix_.zeros(mi, 1); // a temporary placeholder vector of dimension mi
	}
	
	// Computation of the diagonal matrices T and S = [Se Si]^t with alpha = 1
	// and mu = 0.9995, nu = 0.9995 (so that mu * nu < 1), c.f. formula 10 and
	// remark 3 of the first reference.
	//
	// Note: in case a column or a row of the matrix [Ae Ai]^t has all its elements equal to zero,
	// the associated value in T or S is replaced by 1; this is standard practice, c.f. for instance
	// section 2 of the third reference.
	var mu = 0.9995;
	var nu = 0.9995;
	var T = Matrix_.fill(n, 1, 
				function(i,j) { 
						var columnNorm = 0;
						if (eqContraints) {
						    var aeColNorm = Ae.vectorNorm('one', 'column', i); 
							columnNorm += aeColNorm;
						}
						if (ineqContraints) {
						    var aiColNorm = Ai.vectorNorm('one', 'column', i);
							columnNorm += aiColNorm;
						}
						if (columnNorm == 0) {
							columnNorm = 1;
						}
						return mu * 1/columnNorm;
				});
	
	var Se = null;
	if (eqContraints) {
	    Se = Matrix_.fill(me, 1, 
	                      function(i,j) { 
						    var aeRowNorm = Ae.vectorNorm('one', 'row', i);
							if (aeRowNorm == 0) {
								aeRowNorm = 1;
							}
							return nu * 1/aeRowNorm;
				          });
	}
	var Si = null;
	if (ineqContraints) {
	    Si = Matrix_.fill(mi, 1, 
	                      function(i,j) { 
						    var aiRowNorm = Ai.vectorNorm('one', 'row', i);
							if (aiRowNorm == 0) {
								aiRowNorm = 1;
							}
			        	    return nu * 1/aiRowNorm;
				          });
	}
	
	// ------
	
	// Main loop of the algorithm, c.f. formula 18 of the first reference.
	//
	// The convergence is guaranteed by the theorem 1 of the first reference
	// in case the primal linear program admit a finite optimal solution.
	//
	// To be noted that the formulation used below is slightly different from
	// the formulation in formula 17 of the first reference (equality constraints only).
	//
	// To arrive at this form, the formulation below mixes formula 17 of the first reference,
	// formula 26 of the second reference, and additional bound constraints on x.
	var iter = 0;
	while (true) {
		// Check the number of iterations
		if (maxIterations !== -1 && iter >= maxIterations) {
			throw new Error('maximum number of iterations reached: ' + maxIterations);
		}

		// Update the number of iterations
		++iter;

		// Primal update: 
		// - x_k+1 = proj(x_k - T*(A^t*y_k + c))_[0, +infinity[, with A = [Ae Ai]^t and y_k = [ye yi]^t (no bound constraints)
		// - x_k+1 = proj(x_k - T*(A^t*y_k + c))_[lb, ub], with A = [Ae Ai]^t and y_k = [ye yi]^t (bound constraints)
		if (eqContraints && ineqContraints) {
			x_kp = Matrix_.xpy(Matrix_.xpy(Matrix_.txy(Ae, ye_k, tmp_vec_n), Matrix_.txy(Ai, yi_k, ttmp_vec_n), tmp_vec_n), c, x_kp);
		}
		else if (eqContraints) {
			x_kp = Matrix_.xpy(Matrix_.txy(Ae, ye_k, tmp_vec_n), c, x_kp);
		}
		else if (ineqContraints) {
			x_kp = Matrix_.xpy( Matrix_.txy(Ai, yi_k, tmp_vec_n), c, x_kp);
		}
		x_kp = Matrix_.xmy(x_k, Matrix_.elementwiseProduct(x_kp, T, tmp_vec_n), x_kp);
		if (boundContraints) {
			// Projection on the interval [lb, ub]
			for (var i = 1; i <= n; ++i) {
				if (x_kp.data[i-1] < lb.data[i-1]) {
					x_kp.data[i-1] = lb.data[i-1];
				}
				else if (x_kp.data[i-1] > ub.data[i-1]) {
					x_kp.data[i-1] = ub.data[i-1];
				}
			}
		}
		else {			
			// Projection on the non-negative orthant
			for (var i = 1; i <= n; ++i) {
				if (x_kp.data[i-1] < 0) {
					x_kp.data[i-1] = 0;
				}
			}
		}

		// Relaxed iterate update:
		// - z_k = 2*x_k+1 - x_k
		z_k = Matrix_.axpby(2, x_kp, -1, x_k, z_k);
		
		// Dual update:
		// - ye_k+1 = ye_k + Se*(Ae*z_k - be) (equality constraints)
		// - yi_k+1 = proj(yi_k + Si*(Ai*z_k - bi))_[0, +infinity[ (inequality constraints)
		if (eqContraints) {
			ye_kp = Matrix_.xpy(ye_k, Matrix_.elementwiseProduct(Matrix_.xmy(Matrix_.xy(Ae, z_k, tmp_vec_me), be, tmp_vec_me), Se, tmp_vec_me), ye_kp);
		}
		if (ineqContraints) {
			yi_kp = Matrix_.xpy(yi_k, Matrix_.elementwiseProduct(Matrix_.xmy(Matrix_.xy(Ai, z_k, tmp_vec_mi), bi, tmp_vec_mi), Si, tmp_vec_mi), yi_kp);
			
			// Projection on the non-negative orthant
			for (var i = 1; i <= mi; ++i) {
				if (yi_kp.data[i-1] < 0) {
					yi_kp.data[i-1] = 0;
				}
			}
		}
	
		// Convergence conditions for (x_k, y_k = [ye yi]^t) to be a saddle point of the min-max problem:
		// - Convergence of the primal iterates (relative) x_k: ||x_k+1 - x_k||_inf <= eps * ||x_k+1||_inf
		// - Convergence of the dual iterates (relative) y_k: ||y_k+1 - y_k||_inf <= eps * ||y_k+1||_inf
		res_x_kp_x_k = Matrix_.xmy(x_kp, x_k, res_x_kp_x_k);
		var res_x_kp_x_k_inf_norm = res_x_kp_x_k.vectorNorm('infinity');
		var x_kp_inf_norm = x_kp.vectorNorm('infinity');
		
		var res_ye_kp_ye_k_inf_norm = 0;
		var ye_kp_inf_norm = 0;
		if (eqContraints) {
		    res_ye_kp_ye_k = Matrix_.xmy(ye_kp, ye_k, res_ye_kp_ye_k);
		    res_ye_kp_ye_k_inf_norm = res_ye_kp_ye_k.vectorNorm('infinity');
											 
			ye_kp_inf_norm = ye_kp.vectorNorm('infinity');
		}
		
		var res_yi_kp_yi_k_inf_norm = 0;
		var yi_kp_inf_norm = 0;
		if (ineqContraints) {
		    res_yi_kp_yi_k = Matrix_.xmy(yi_kp, yi_k, res_yi_kp_yi_k);
		    res_yi_kp_yi_k_inf_norm = res_yi_kp_yi_k.vectorNorm('infinity');
			
			yi_kp_inf_norm = yi_kp.vectorNorm('infinity');
		}
		
		if (res_x_kp_x_k_inf_norm <= eps * x_kp_inf_norm  && 
		    res_ye_kp_ye_k_inf_norm <= eps * ye_kp_inf_norm &&
			res_yi_kp_yi_k_inf_norm <= eps * yi_kp_inf_norm) {
			break;
		}
		
		// Prepare the next iteration:
		// - x_k = x_k+1
		// - y_k = y_k+1 <=> ye_k = ye_k+1, yi_k = yi_k+1
		x_k = Matrix_.copy(x_kp, x_k);
		if (eqContraints) {
		    ye_k = Matrix_.copy(ye_kp, ye_k);
		}
		if (ineqContraints) {
		    yi_k = Matrix_.copy(yi_kp, yi_k);
		}
	}
	
	// Compute the objective function value.
	var fctVal = Matrix_.vectorDotProduct(c, x_kp);

	// Return the computed primal iterate and the associated objective
	// function value.
	return [x_kp, fctVal];		
 }
 
 

/**
* @author Roman Rubsamen <roman.rubsamen@gmail.com>
*/

 



/**
* @function returns
*
* @summary Compute the period-to-period returns of a series of values.
*
* @description This function returns the period-to-period returns of a series of values.
*
* The period-to-period returns of a series of values are defined as the series of the returns of the series of values
* over each of its valuation period, with the return associated to the first period being undefined.
*
* @see <a href="https://en.wikipedia.org/wiki/Rate_of_return">https://en.wikipedia.org/wiki/Rate_of_return</a>
* 
* @param {Array.<number>} x the series of values, an array of T real numbers, with T corresponding to the number of valuation periods.
* @param {object} opt optional parameters for the returns computation.
* @param {string} opt.method the method to use to compute the returns, a string either equals to:
* - "arithmetic", in order to compute the arithmetic returns, c.f. the reference
* - "logarithmic", in order to compute the logarithmic returns, c.f. the reference
; defaults to "arithmetic"

* @return {Array.<number>} the period-to-period returns of x.
*
* @example
* returns([1, 2, 1]); 
* // [1.0, -0.5], i.e. 100% arithmetic return from the first period to the second period, 
* // and -50% arithmetic return from the second period to the third period
*/
self.returns = function(x, opt) {
	// Initialize default parameters
	var opt = opt;
	if (opt === undefined) {
		opt = { };
	}
	if (opt.method === undefined) {
		opt.method = "arithmetic";
	}
	
	
	// Decode the parameters
	var method = opt.method;
	if (method != "arithmetic" &&
	    method != "logarithmic") {
			throw new Error('unsupported returns computation method');
	}
	
	
	// Compute the returns
	var returns = typeof Float64Array === 'function' ? new Float64Array(x.length - 1) : new Array(x.length - 1); 

	if (method == "arithmetic") {
		for (var i = 0; i < x.length - 1; ++i) {
			returns[i] = (x[i+1] - x[i])/x[i];
		}
	}
	else if (method == "logarithmic") {
		for (var i = 0; i < x.length - 1; ++i) {
			returns[i] = Math.log(x[i+1]/x[i]);
		}
	}
	else {
		throw new Error('internal error: unsupported returns computation method');
	}
	

	// Return the computed returns
	return returns;
}
/**
* @file Functions related to computations on the unit simplex.
* @author Roman Rubsamen <roman.rubsamen@gmail.com>
*/




/**
* @function simplexCharacteristicFunction_
*
* @summary The characteristic function of the restricted unit simplex of R^n.
*
* @description This function is the characteristic function of the restricted unit simplex of R^n,
* c.f. the reference, so that it returns:
* - 0 <=> x belongs to the restricted unit simplex of R^n
* - +oo <=> x does not belong to the restricted unit simplex of R^n
*
* By definition, x belongs to the restricted simplex of R^n if and only if its coordinates satisfy:
* - sum x_i == 1
* - l_i <= x_i <= u_i <= 1, i = 1..n
*
* @see <a href="https://en.wikipedia.org/wiki/Characteristic_function_(convex_analysis)">Characteristic function (convex analysis)</a>
*
* @param {Array.<number>} x, a point belonging to R^n, array of n real numbers.
* @param {Array.<number>} l the optional lower bounds contraints, an array of n real numbers l_i which must satisfy 0 <= l_i <= u_i <= 1, i = 1..n; defaults to an array made of zeros.
* @param {Array.<number>} u the optional upper bounds contraints, an array of n real numbers u_i which must satisfy 0 <= l_i <= u_i <= 1, i = 1..n; defaults to an array made of ones.
* @return {number} In case the point x belongs to the restricted unit simplex of R^n, returns 0, otherwise, returns Number.POSITIVE_INFINITY.
*
* @example
* simplexCharacteristicFunction_([0.1, 0.9]);
* // == 0
*
* @example
* simplexCharacteristicFunction_([0.1, 1.9]);
* // == Number.POSITIVE_INFINITY
*/
function simplexCharacteristicFunction_(x, l, u) {
	// Initializations
	var n = x.length;
	var eps_tol = 1e-12; // used to numerically determine some conditions


	// Emptiness check on the restricted simplex.
	//
	// In case the restricted simplex is empty, an exception is thrown, so that
	// the process is (violently) stopped here.
	simplexEmptinessCheck_(n, l, u);
	
	
	// Check if the point x belongs to the restricted unit simplex
	var sum_xi = 0;
	for (var i = 0; i < n; ++i) {	
		// Extract the i-th coordinate of the restricted simplex lower bound
		var lb_i = 0;
		if (l) {
			lb_i = l[i];
		}
		
		// Extract the i-th coordinate of the restricted simplex upper bound
		var up_i = 1;
		if (u) {
			up_i = u[i];
		}
		
		// Extract the i-th coordinate of the point x
		var x_i = x[i];

		// Compare the i-th coordinate of the point x with the lower and the upper bounds
		// of the restricted simplex.
		if (x_i < lb_i || x_i > up_i) {
			return Number.POSITIVE_INFINITY;
		}
		
		// Compute the sum of the coordinates of the point x for later use
		sum_xi += x_i;
	}
	
	// Check if the point x belongs to the restricted unit simplex, second step.
	//
	// Note: Due to limited numerical precision, the test on the sum of the coordinates
	// of the point x (which must be equal to 1) cannot be exact.
	if (Math.abs(sum_xi - 1) > eps_tol) {
		return Number.POSITIVE_INFINITY;
	}
	

	// At this stage, the input point x belongs to the restricted unit simplex
	return 0;
}



/**
* @function simplexEmptinessCheck_
*
* @summary Checks the emptiness of the restricted unit simplex.
*
* @description This function checks the emptiness of the restricted unit simplex
* of R^n, which is defined as the unit simplex of R^n subject to lower and upper 
* bounds contraints.
*
* In more details, this functions checks that the lower bounds l_i, i = 1..n 
* and the upper bounds u_i, i = 1..n satisfy:
* - 0 <= l_i <= u_i <= 1, i = 1..n
* - sum l_i < 1 < sum u_i, c.f. formula 2.2 of the reference
*
* @see <a href="https://doi.org/10.1016/S0167-7152(99)00095-4">Kai-Tai Fang, Zhen-Hai Yang, On uniform design of experiments with restricted
* mixtures and generation of uniform distribution on some domains, Statistics & Probability Letters, Volume 46, Issue 2, 
* 15 January 2000, Pages 113-120</a>
*
* @param {number} n the dimension of the unit simplex of R^n, natural integer superior or equal to 1.
* @param {Array.<number>} l the optional lower bounds contraints, an array of n real numbers l_i which must satisfy 0 <= l_i <= u_i <= 1, i = 1..n; defaults to an array made of zeros.
* @param {Array.<number>} u the optional upper bounds contraints, an array of n real numbers u_i which must satisfy 0 <= l_i <= u_i <= 1, i = 1..n; defaults to an array made of ones.
* @throws Throws an error in case the restricted unit simplex is empty.
* @return {Array.<number>} In case the restricted unit simplex is not empty, returns an array of 2 real numbers:
* - the sum of the lower bounds, sum l_i
* - the sum of the upper bounds, sum u_i
*
* @example
* simplexEmptinessCheck_(3, [0.5, 0.1, 0.2]);
* //[0.8, 3]
*
* @example
* simplexEmptinessCheck_(3, [0.7, 0.3, 0.2]);
* // new Error("infeasible problem detected: the restricted simplex is empty")
*/
function simplexEmptinessCheck_(n, l, u) {
	// Initializations
	var sumLowerBounds = 0;
	var sumUpperBounds = 0;
	
	// - Feasibility checks on the restricted simplex:
	// -- Lower bounds and upper bounds must satisfy 0 <= l_i <= u_i <= 1, i = 1..n
	// -- Lower bounds and upper bounds must satisfy sum l_i < 1 < sum u_i, c.f. formula 2.2 of the reference
	for (var i = 0; i < n; ++i) {
		var lowerBound = 0;
		if (l) {
			lowerBound = l[i];
		}

		var upperBound = 1;
		if (u) {
			upperBound = u[i];
		}

		// Check on lower and upper bounds l_i and u_i
		if (lowerBound > upperBound) {
			throw new Error('infeasible problem detected: lower bound strictly greater than upper bound');
		}
		if (lowerBound < 0) {
			throw new Error('incorrect problem detected: lower bound strictly lower than 0');
		}
		if (upperBound > 1) {
			throw new Error('incorrect problem detected: upper bound strictly greater than 1');
		}
		
		// Compute the running sum of lower and upper bounds, for subsequent feasibility check
		sumLowerBounds += lowerBound;
		sumUpperBounds += upperBound;		
	}
	
	if (sumLowerBounds > 1 || sumUpperBounds < 1) {
		throw new Error('infeasible problem detected: the restricted simplex is empty');
	}
	
	// Return the sum of lower bounds and the sum of upper bounds,
	// for potential usage in the calling function.
	return [sumLowerBounds, sumUpperBounds];
}


/**
* @function simplexSparseEuclidianProjection_
*
* @summary Returns a closest point on the unit simplex subject to a sparsity constraint.
*
* @description This function computes an at most k-sparse euclidean projection of a point
* x = (x_1,...,x_n) in R^n onto the unit simplex of R^n.
* 
* Optionally, lower bounds and upper bounds constraints can be added to the problem, in which case 
* the unit simplex becomes a restricted unit simplex, and the bounds constraints are then to be understood
* as applying only to the at most k coordinates selected to be part of the computed projection.
*
* In case there are no bounds constraints, the algorithm used is an O(n) implementation of
* the algorithm 1 of the first reference.
*
* In case there are bounds constraints, the problem is NP-complete in general, c.f. the third reference,
* so that the only way to guarantee an exact solution is through an exhaustive computation 
* over all the subsets of size <= k of the set of indexes {1,...,n}, searching for an optimal and feasible
* index set solving the projection problem, c.f. section 5.1 of the second reference.
*
* This is unfortunately only tractable for small n in general (n <= 20), or certain
* (n, k) pairs with k << n or k ~ n.
* 
* @see <a href="https://arxiv.org/abs/1206.1529">Anastasios Kyrillidis, Stephen Becker, Volkan Cevher and, Christoph Koch, Sparse projections onto the simplex, arXiv:1206.1529 [cs.LG]</a>
* @see <a href="https://link.springer.com/article/10.1007/s11425-016-9124-0">Fengmin Xu, Yuhong Dai, Zhihu Zhao and Zongben Xu, Efficient projected gradient methods for cardinality constrained optimization, Science China Mathematics volume 62, pages245–268(2019)</a>
* @see <a href="https://epubs.siam.org/doi/abs/10.1137/140978077">Oleg P. Burdakov, Christian Kanzow, and Alexandra Schwartz, Mathematical Programs with Cardinality Constraints: Reformulation by Complementarity-Type Conditions and a Regularization Method, SIAM J. Optim., 26(1), 397–425.</a>
*
* @param {Array.<number>} x, a point belonging to R^n, array of n real numbers.
* @param {number} k, a natural integer strictly greater than one corresponding to the maximum desired sparsity
* (i.e., non-zero elements) of the projected point.
* @param {Array.<number>} l the optional lower bounds constraints, an array of n real numbers l_i which must satisfy 0 <= l_i <= u_i <= 1, i = 1..n; 
* defaults to an array made of zeros if u is provided, otherwise to null.
* @param {Array.<number>} u the optional upper bounds constraints, an array of n real numbers u_i which must satisfy 0 <= l_i <= u_i <= 1, i = 1..n;
defaults to an array made of ones if l is provided, otherwise to null.
*
* @return {Array.<number>|Float64Array} the computed closest point to x with at most k non-zero elements, array of n real numbers.
*
* @example
* simplexSparseEuclidianProjection_([0.5, 0.1, 0.2], 1);
* //[1,0,0]
*/
function simplexSparseEuclidianProjection_(x, k, l, u) {
	// Initializations
	var n = x.length;
	
	
	// Short circuit in case there is no sparsity
	if (k === n) {
		return simplexEuclidianProjection_(x, l, u);
	}
	
	
	// In case no bounds constraints are provided, use the algorithm 1 of the first reference.
	if (!l && !u) {
		// Compute the support of the projection, i.e., the k largest elements of x.
		
		// Initialize the indexes of the elements of x
		var idx = typeof UInt32Array === 'function' ? new UInt32Array(n) : new Array(n);
		for (var i = 0; i < n; ++i) {
			idx[i] = i;
		}
		
		// Per property of the SELECT algorithm of Floyd and Rivest, the array idx is permuted
		// so that the indexes of the largest k elements of x are at the indexes 0..k-1 of the
		// array idx.
		var compareIndexes = function (a, b) {
			return x[b] - x[a];
		};
		select_(idx, k, compareIndexes);

		// Extract the k largest elements of x
		var x_k = x.slice(0, k);
		for (var i = 0; i < k; ++i) {
			x_k[i] = x[idx[i]];
		}
		
		
		// Compute the projection on the unit simplex of the k largest elements of x.
		var proj_x_k = simplexEuclidianProjection_(x_k);
		
		
		// Compute the final projection by re-conciliating the support of the
		// projection above and its complementary set.
		var y = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n);
		for (var i = 0; i < k;  ++i) {
			y[idx[i]] = proj_x_k[i];
		}
		for (var i = k; i < n;  ++i) {
			y[idx[i]] = 0;
		}
		
		
		// Return the computed projection
		return y;
	}
	// In case bounds constraints are provided, the computation is unfortunately 
	// NP-complete in general, c.f. the third reference.
	else {
		// Convert x to Matrix format to ease the computations below
		var x = new Matrix_(x);
		
		// Initialize the current minimum euclidean distance between x and the
		// best at most k-sparse projection of x, as well as the current list of 
		// associated indexes.
		var minDistanceValue = Infinity;
		var minDistanceIndexes = [];
		var minDistanceProjX = null;
		
		// An exhaustive enumeration of all the subsets of the set {1,...,n} 
		// of size between 1 and k is done, searching for the best feasible 
		// projection over all these subsets.
		for (var K = 1; K <= k; ++K) {
			var nextKSubsetIterator = new kSubsetsIterator_(n, K, false);
			var nextKSubset = nextKSubsetIterator.next();
			
			while (nextKSubset != -1) {
				// Extract the selected indexes of {1..n}
				var subsetNbIndexes = nextKSubset.length;
				var subsetIndexes = typeof UInt32Array === 'function' ? new UInt32Array(subsetNbIndexes) : new Array(subsetNbIndexes);
				for (var i = 0; i < subsetNbIndexes; ++i) {
					subsetIndexes[i] = nextKSubset[i];
				}

				// Extract the coordinates of the vector x associated to the selected indexes
				var subsetX = typeof Float64Array === 'function' ? new Float64Array(subsetNbIndexes) : new Array(subsetNbIndexes);
				for (var i = 0; i < subsetNbIndexes; ++i) {
					subsetX[i] = x.data[subsetIndexes[i]-1];
				}

				// Extract the lower and upper bounds constraints associated to the selected indexes
				var subsetL = typeof Float64Array === 'function' ? new Float64Array(subsetNbIndexes) : new Array(subsetNbIndexes);
				if (l) {
					for (var i = 0; i < subsetNbIndexes; ++i) {
						subsetL[i] = l[subsetIndexes[i]-1];
					}
				}
				else {
					for (var i = 0; i < subsetNbIndexes; ++i) {
						subsetL[i] = 0;
					}
				}
				var subsetU = typeof Float64Array === 'function' ? new Float64Array(subsetNbIndexes) : new Array(subsetNbIndexes);
				if (u) {
					for (var i = 0; i < subsetNbIndexes; ++i) {
						subsetU[i] = u[subsetIndexes[i]-1];
					}
				}
				else {
					for (var i = 0; i < subsetNbIndexes; ++i) {
						subsetU[i] = 1;
					}
				}
				
				// Compute the projection of the selected indexes of x on the restricted simplex.
				//
				// If the projection is better (in the sense of the euclidean distance to x) than the current
				// best projection, it becomes the new best projection and the current subset of indexes
				// becomes the new optimal subset of indexes.
				//
				// Note: because the restricted simplex associated to the subset of selected indexes
				// might be empty, special care must be taken.
				try {
					// Compute the projection
					var proj_subsetX = simplexEuclidianProjection_(subsetX, subsetL, subsetU);
					
					// Transform the projection into an at most k sparse vector of R^n
					var proj_x = Matrix_.zeros(n, 1);
					for (var i = 0; i < subsetNbIndexes; ++i) {
						proj_x.data[subsetIndexes[i] - 1] = proj_subsetX[i];
					}
					
					// Compute the euclidean distance between the initial x and the 
					// at most k sparse vector above.
					var d_x_proj_x = Matrix_.axpby(1, x, -1, proj_x).vectorNorm('two');
					
					// Determine if the projection above is better than the current best projection
					if (d_x_proj_x < minDistanceValue) {
						minDistanceValue = d_x_proj_x;
						minDistanceIndexes = subsetIndexes;
						minDistanceProjX = proj_x;
					}
					
				}
				catch (e) {
					if (e.message !== "infeasible problem detected: the restricted simplex is empty") {
						throw(e);
					}
				}

				// Generate a new subset	
				var nextKSubset = nextKSubsetIterator.next();
			}
		}
		
		// In case a best projection has been found, return it.
		if (minDistanceValue != Infinity) {
			return minDistanceProjX.toArray();
		}
		else {
			throw new Error('infeasible problem detected');
		}
	}
}

/**
* @function simplexEuclidianProjection_
*
* @summary Returns the closest point on the unit simplex.
*
* @description This function computes the euclidean projection of a point
* x = (x_1,...,x_n) in R^n onto the unit simplex of R^n.
*
* Optionally, lower bounds and upper bounds constraints can be added to the problem, in which case 
* the unit simplex becomes a restricted unit simplex.
*
* Internally, the algorithm used is an O(n) algorithm, c.f. the reference.
*
* @see <a href="https://link.springer.com/article/10.1007/s10107-006-0050-z">Kiwiel, K.C., Breakpoint searching algorithms 
* for the continuous quadratic knapsack problem, Math. Program. (2008) 112: 473</a>
*
* @param {Array.<number>} x a point belonging to R^n, array of n real numbers.
* @param {Array.<number>} l the optional lower bounds constraints, an array of n real numbers l_i which must satisfy 0 <= l_i <= u_i <= 1, i = 1..n; defaults to an array made of zeros.
* @param {Array.<number>} u the optional upper bounds constraints, an array of n real numbers u_i which must satisfy 0 <= l_i <= u_i <= 1, i = 1..n; defaults to an array made of ones.
* @return {Array.<number>} the computed closest point to x, array of n real numbers.
*
* @example
* simplexEuclidianProjection_([1, 1, 1]);
* // [~0.33, ~0.33, ~0.33]
*/
function simplexEuclidianProjection_(x, l, u) {
	// Initializations
	var n = x.length;

	
	// Emptiness check on the restricted simplex.
	//
	// In case the restricted simplex is empty, an exception is thrown, so that
	// the process is (violently) stopped here.
	simplexEmptinessCheck_(n, l, u);


	// Convert the problem of the euclidean projection on the restricted unit simplex
	// into the associated instance of the continuous quadratic knapsack problem.	
	var d = Matrix_.ones(n, 1);
	var a = new Matrix_(x);
	var b = Matrix_.ones(n, 1);
	var r = 1;
	var lb = l ? new Matrix_(l) : Matrix_.zeros(n, 1);
	var ub = u ? new Matrix_(u) : Matrix_.ones(n, 1);

	
	// Solve this instance.
	var sol = qksolveBS_(d, a, b, r, lb, ub);
	var y = sol[0];

	
	// Return the computed projection
	return y.toArray();
}


/**
* @function simplexGridSampler_
*
* @summary Returns a function to generate all the points on a rational grid of the unit simplex of R^n.
*
* @description This function constructs a function to generate all the points on the k-th rational grid
* of the unit simplex of R^n, 1/k * I_n(k), c.f. the first reference.
* 
* The algorithm used internally is based on the enumeration of all the k-compositions of the integer n, c.f. the second reference.
*
* @see <a href="https://ideas.repec.org/p/cor/louvco/2003071.html">Nesterov, Yurii. Random walk in a simplex and quadratic
*  optimization over convex polytopes. CORE Discussion Papers ; 2003/71 (2003)</a>
* @see <a href="https://en.wikipedia.org/wiki/Composition_(combinatorics)">Composition (combinatorics)</a>
*
* @param {number} n the dimension of the unit simplex of R^n, natural integer superior or equal to 1.
* @param {number} k the indice of the rational grid of the unit simplex of R^n on which to generate points, 
* a natural integer superior or equal to 1.
* @param {boolean} reuseOutputArray an optional boolean that can be set to true to re-use the same output array throughout
* all the computations (this improves the performances, but requires the caller to NOT alter the output array); defaults to false.
* @return {function} a function to be used through its .sample() method, computing all 
* the points on the k-th rational grid of the unit simplex of R^n.
*
* @example
* var mySampler = new simplexGridSampler_(3, 10);
* mySampler.sample(); mySampler.sample(); ...; mySampler.sample();
* // [1, 0, 0]; [0.9, 0.1, 0]; ...; -1
*/
function simplexGridSampler_(n, k, reuseOutputArray) {
	// Initializations
	this.n = n;
	this.k = k;
	
	this.reuseOutputArray = reuseOutputArray;
	
	this.x = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n); // the coordinates of a point being sampled
	this.compositionIterator = new compositionsIterator_(k, n, true); // reuse the ouput array for better performances
	
	/**
	* @function sample
	*
	* @summary Returns a point on the k-th rational grid of the unit simplex of R^n.
	*
	* @description This function generates a point on the k-th rational grid of the unit simplex of R^n.
	*
	* Each call to this function results in the generation of a new point on the k-th rational grid
	* of the unit simplex of R^n, until exhaustion of all such points.
	*
	* @memberof simplexDeterministicRationalSampler_
	* @return {Array.<number>|Float64Array|-1} an array of n real numbers corresponding to the coordinates of the generated point in R^n,
	* or -1 in case all such points have been generated.
	*/
	this.sample = function() {
		// Generate a new k-composition of n
		var comp = this.compositionIterator.next();

		// Return -1 in case there is no more samples to draw
		if (comp == -1) {
			return -1;
		}
		
		// Otherwise, compute the current rational grid point by normalizing the generated k-composition
		for (var i = 0; i < this.n; ++i) {
			this.x[i] = comp[i] / this.k;
		}

		// Return either the point being sampled, or a copy of the point being sampled so that callers can alter it
		if (this.reuseOutputArray) {
			return this.x;
		}
		else {
			return this.x.slice(0);
		}
	}
}
 
 

/**
* @function simplexRandomSampler_
*
* @summary Returns a function to compute random points on the unit simplex of R^n.
*
* @description This function constructs a function to compute random points uniformly distributed on either:
* - the unit simplex of R^n, using the algorithm 2 of the first reference
* - the unit simplex of R^n subject to additional lower bounds and upper bounds constraints, i.e. 
* {(x_1,...,x_n), sum x_i = 1 and 0 <= l_i <= x_i <= u_i <= 1, i = 1..n}, where l_i and u_i, i = 1..n are real numbers, 
* using the theorem 1 of the second reference
* 
* @see <a href="https://doi.org/10.1016/0377-2217(82)90161-8">R.Y. Rubinstein, Generating random vectors uniformly distributed inside and on 
* the surface of different regions, In European Journal of Operational Research, Volume 10, Issue 2, 1982, Pages 205-209</a>
* @see <a href="https://doi.org/10.1016/S0167-7152(99)00095-4">Kai-Tai Fang, Zhen-Hai Yang, On uniform design of experiments with restricted
* mixtures and generation of uniform distribution on some domains, Statistics & Probability Letters, Volume 46, Issue 2, 
* 15 January 2000, Pages 113-120</a>
*
* @param {number} n the dimension of the unit simplex of R^n, natural integer superior or equal to 1.
* @param {Array.<number>} l the optional lower bounds constraints, an array of n real numbers l_i which must satisfy 0 <= l_i <= u_i <= 1, i = 1..n.
* @param {Array.<number>} u the optional upper bounds constraints, an array of n real numbers u_i which must satisfy 0 <= l_i <= u_i <= 1, i = 1..n.
* @param {function} rnd an optional random vector generator in the unit hypercube of R^n-1, a function taking no input argument and
* returning an array of n-1 points each belonging to the interval (0, 1).
* @return {function} a function computing the random points to be used through its .sample() method.
*
* @example
* var mySampler = new simplexRandomSampler_(3);
* mySampler.sample();
* // [0.25, 0, 0.75]
*
* var mySampler = new simplexRandomSampler_(3, [0.1, 0.2, 0.3], [1,1,1]);
* mySampler.sample();
* // [0.20, 0.20, 0.60]
*/
function simplexRandomSampler_(n, l, u, rnd) {
	// Initializations
	this.n = n;
	this.x = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n); // the coordinates of a point being sampled
	this.u = typeof Float64Array === 'function' ? new Float64Array(n-1) : new Array(n-1); // the coordinates of a random point in the unit hypercube of R^n-1

	// Initialization of the random number generator
	//
	// By default, it generates points uniformly at random in the unit hypercube of R^n-1
	this.randomGenerator = function(arr) {
		for (var i = 0; i < this.n; ++i) {
			arr[i] = Math.random();
		}
	}
	if (rnd) {
		if (typeof rnd !== "function") {
			throw new Error('the random number generator must be a function');
		}
		this.randomGenerator = rnd;
	}

	// Misc. checks on the optional lower and upper bounds
	if (l) {
		this.lowerBounds = l; // no input checks
		
		if (!u) {
			this.upperBounds = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n);
			
			// Initialization to an array of ones
			for (var i = 0; i < this.n; ++i) {
				this.upperBounds[i] = 1;
			}
		}
	}
	if (u) {
		this.upperBounds = u; // no input checks
		
		if (!l) {
			this.lowerBounds = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n);

			// Initialization to an array of zeros
			for (var i = 0; i < this.n; ++i) {
				this.lowerBounds[i] = 0;
			}
		}
	}
	
	// Misc. computations in case the simplex is being sampled through the theorem 1
	// of the second reference:
	//
	if (this.lowerBounds || this.upperBounds) {
		// Emptiness check on the restricted simplex.
		//
		// In case the restricted simplex is empty, an exception is thrown, so that
		// the process is (violently) stopped here.
		var sumBounds = simplexEmptinessCheck_(n, this.lowerBounds, this.upperBounds);
		this.sumLowerBounds = sumBounds[0];
		this.sumUpperBounds = sumBounds[1];
		
		// In case lower bounds or upper bounds are binding (sum l_i == 1 or sum u_i == 1), 
		// the computations are prematurely stopped, because the restricted simplex is then equal to a point.
		//
		// Otherwise:
		// - Deletion of possible superfluous constraints, as described in formula 2.3 of the second reference
		//
		// - Computation of the upper bounds*, as defined after formula 2.3' of the second reference
		//
		// - In parallel of the steps above, computation of upper* bounds sums, 
		// as well as the upper* bounds running sum
		if (this.sumLowerBounds == 1 || this.sumUpperBounds == 1) {
			// Nothing to do
		}
		else {
			// Deletion of possible superfluous constraints, replacing the lower and upper bounds
			var updatedSumLowerBounds = 0;
			var updatedSumUpperBounds = 0;
			for (var i = 0; i < this.n; ++i) {
				var lowerBound = this.lowerBounds[i];
				var upperBound = this.upperBounds[i];
				
				var updatedLowerBound = Math.max(lowerBound, upperBound + 1 - this.sumUpperBounds);
				var updatedUpperBound = Math.min(upperBound, lowerBound + 1 - this.sumLowerBounds);
				
				this.lowerBounds[i] = updatedLowerBound;
				this.upperBounds[i] = updatedUpperBound;

				updatedSumLowerBounds += updatedLowerBound;
				updatedSumUpperBounds += updatedUpperBound;
			}
			this.sumLowerBounds = updatedSumLowerBounds;
			this.sumUpperBounds = updatedSumUpperBounds;
			
			// Computation of upper* bounds
			this.upperStarBounds = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n);
			this.runningSumUpperStarBounds = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n);
			
			var sumUpperStarBounds = 0;
			for (var i = 0; i < this.n; ++i) {
				this.upperStarBounds[i] = (this.upperBounds[i] - this.lowerBounds[i]) / (1-this.sumLowerBounds);
				
				sumUpperStarBounds += this.upperStarBounds[i];
				this.runningSumUpperStarBounds[i] = sumUpperStarBounds;
			}
		}
	}


	/**
	* @function sample_no_bounds
	*
	* @summary Returns a random point on the unit simplex of R^n.
	*
	* @description This function computes a point chosen uniformly at random on the unit simplex of R^n,
	* using the O(n) algorithm 2 of the first reference.
	*
	* @memberof simplexRandomSampler_
	* @return {Array.<number>|Float64Array} an array of n real numbers corresponding to the coordinates of the computed point in R^n.
	*
	*/
	this.sample_no_bounds = function() {
		// Computation of n independent random variables from EXP(1), which will form the basis
		// of the coordinates of the point being sampled	
		var sum = 0;
		for (var i = 0; i < this.n; ++i) {
			// Generate a random variable from EXP(1) using the inverse method, with no need for the minus sign
			// as the negative sign would cancel out at the subsequent normalization step.
			var u = 1 - Math.random(); // belongs to ]0,1], so that the logarithm below is properly defined
			var e = Math.log(u); // e ~ EXP(1)

			// Set the i-th coordinate of the point being sampled.
			this.x[i] = e;
			
			// Compute the running sum of the exponential variables, for the subsequent normalization step.
			sum += e;
		}

		// Normalization of the computed coordinates of the point being sampled, so that
		// they all belong to [0,1] and sum to 1.
		for (var i = 0; i < this.n; ++i) {
			this.x[i] = this.x[i]/sum;
		}
		
		// Return a copy of the point being sampled, so that callers can alter it.
		return this.x.slice(0);
	}

	/**
	* @function sample_binding_bounds
	*
	* @summary Returns a random point on the unit simplex of R^n subject to exact bounds
	* on its coordinates.
	*
	* @description This function computes a point chosen uniformly at random on the unit simplex of R^n,
	* subject to an exact bounds constraints on its coordinates, which makes the point unique and non random.
	*
	* @memberof simplexRandomSampler_
	* @return {Array.<number>|Float64Array} an array of n real numbers corresponding to the coordinates of the computed point in R^n.
	*
	*/
	this.sample_binding_bounds = function() {
		// Determination of the binding bounds
		var bindingBounds = null;
		if (this.sumLowerBounds == 1) {
			bindingBounds = this.lowerBounds;
		}
		else if (this.sumUpperBounds == 1) {
			bindingBounds = this.upperBounds;
		}
		else {
			throw new Error('internal error');
		}

		// Generation of a point on the restricted simplex, with its coordinates equal to the binding bounds
		for (var i = 0; i < this.n; ++i) {
			this.x[i] = bindingBounds[i];
		}
		
		// Return a copy of the point being sampled, so that callers can alter it.
		return this.x.slice(0);
	}
	
	/**
	* @function sample_with_bounds
	*
	* @summary Returns a random point on the unit simplex of R^n subject to additional 
	* lower bounds and upper bounds constraints on its coordinates.
	*
	* @description This function computes a point chosen uniformly at random on the unit simplex of R^n,
	* subject to additional lower bounds and upper bounds constraints on its coordinates, using the algorithm
    * adapted from the theorem 1 of the second reference.
	*
	* @memberof simplexRandomSampler_
	* @return {Array.<number>|Float64Array} an array of n real numbers corresponding to the coordinates of the computed point in R^n.
	*
	*/
	this.sample_with_bounds = function() {
		// Generate a point in the unit hypercube of R^n-1
		this.randomGenerator(this.u);
		var u = this.u;

		// Use the theorem 1 of the second reference to generate a random point on T_n(0,upperStarBounds)
		var delta_k = 1;
		for (var k = n; k >= 2; --k) {
			// In case delta_k is numerically null, it means all the remaining coordinates
			// of the random point being generated on T_n(0,upperStarBounds) must be set to zero.
			//
			// The main loop can then be prematurely stopped.
			if (Math.abs(delta_k) <= 1e-14) {
				for (var kk = k; kk >= 1; --kk) {
					this.x[kk-1] = 0;
				}
				break;
			}

			// Retrieve the k-1th coordinate of the random vector u
			var u_k = u[k-2];

			// Compute the function G of theorem 1 of the second reference
			var d_k = Math.max(0, 1 - this.runningSumUpperStarBounds[k-2]/delta_k);			
			var phi_k = Math.min(1, this.upperStarBounds[k-1]/delta_k);			
			var y_k = delta_k * (1 - Math.pow(u_k*Math.pow(1-phi_k, k-1) + (1-u_k)*Math.pow(1-d_k, k-1), 1/(k-1)));
			
			// Update the k-th coordinate of the generated random point
			this.x[k-1] = y_k;
			
			// Prepare for the next iteration
			delta_k -= y_k;			
		}
		if (k == 1) { // In case the main loop above exited with delta not numerically null
			this.x[0] = delta_k; // Update the 1st coordinate of the generated random point
		}

		// Use the linear mapping described after formula 2.3' of the second reference to map
		// the random point above from T_n(0,upperStarBounds) to T_n(lowerBounds,upperBounds).
		for (var i = 0; i < this.n; ++i) {
			this.x[i] = (1-this.sumLowerBounds)*this.x[i] + this.lowerBounds[i];
		}

		// Return a copy of the point being sampled, so that callers can alter it.
		return this.x.slice(0);
	}
	

	// Definition of the sampling method
	if (this.lowerBounds || this.upperBounds) {
		if (this.sumLowerBounds == 1 || this.sumUpperBounds == 1) {
			this.sample = this.sample_binding_bounds;
		}
		else {
			this.sample = this.sample_with_bounds;
		}
	}
	else {
		this.sample = this.sample_no_bounds;
	}
}


/**
* @function simplexDirectionRandomSampler_
*
* @summary Returns a function to compute random directions to be used on the unit simplex of R^n.
*
* @description This function constructs a function to compute random unit directions uniformly distributed on
* the intersection of the unit hypersphere of R^n and of the hyperplane defined by the equation <(1,1,...,1)/x> = 0,
* using the algorithm 2 of the reference.
* 
* @see <a href="https://projecteuclid.org/euclid.ba/1488337478">Cong, Yulai; Chen, Bo; Zhou, Mingyuan. Fast Simulation of 
* Hyperplane-Truncated Multivariate Normal Distributions. Bayesian Anal. 12 (2017), no. 4, 1017--1037. doi:10.1214/17-BA1052.</a>
* @see Nicholas J. Higham. 2002. Accuracy and Stability of Numerical Algorithms (2nd ed.). Soc. for Industrial and Applied Math., Philadelphia, PA, USA. 
*
* @param {number} n the dimension of the unit simplex of R^n, natural integer superior or equal to 1.
* @return {function} a function to be used through its .sample() method, computing random  
* directions to be used on the unit simplex of R^n.
*
* @example
* var mySampler = new simplexDirectionSampler_(3);
* mySampler.sample();
* // [-0.5856783494622358, -0.19984292686015526, 0.7855212763223908]
*/
function simplexDirectionRandomSampler_(n) {
	// Initializations
	this.n = n;
	this.x = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n); // the coordinates of a point being sampled
	
	/**
	* @function sample
	*
	* @summary Returns a random point belonging to the intersection of the unit hypersphere of R^n
	* and of the hyperplane defined by the equation <(1,1,...,1)/x> = 0.
	*
	* @description This function computes a point choosen uniformly at random in the intersection of 
	* the unit hypersphere of R^n and of the hyperplane defined by the equation <(1,1,...,1)/x> = 0,
	* using the O(n) algorithm 2 of the reference.
	*
	* @memberof simplexDirectionSampler_
	* @return {Array.<number>|Float64Array} an array of n real numbers corresponding to the coordinates of the computed point in R^n.
	*
	*/
	this.sample = function() {
		// Computation of n independent random variables from N(0,1), which will form
		// the coordinates of the point x being sampled.
		var sum = 0;
		for (var i = 0; i < this.n; ++i) {
			// Generate a random variable from N(0,1), using the inverse method
			var u = Math.random(); // u ~ U[0,1[
			while (u === 0.0) {
				u = Math.random();
			} // u ~ U]0,1[
			var r = norminv_(u); // r ~ N(0,1)
			
			// Set the i-th coordinate of the point being sampled
			this.x[i] = r;
			
			// Compute the running sum of the normal variables
			sum += r;
		}
		
		// Normalization of the computed coordinates of the point being sampled, so that
		// the associated vector in R^n also belongs to the hyperplane <(1,1,...,1)/x> = 0,
		// i.e. sum x_i = 0.
		// 
		// In parallel, compute the 2 norm of the vector, for subsequent 
		// normalization, with an accurate algorithm by S. J. Hammarling,
		// c.f. problem 27.5 of the second reference.
		//
		// Note: The algorithm 2 of the reference stops here.
		var sum_d_n = sum / this.n;
		var t = 0;
		var s = 1;
		for (var i = 0; i < this.n; ++i) {
			this.x[i] = this.x[i] - sum_d_n;
			
			// Compute the running 2 norm of the associated vector.
			var absX = Math.abs(this.x[i]);
			if (absX != 0) {
				if (absX > t) {
					s = 1 + s * (t/this.x[i]) * (t/this.x[i]);
					t = absX;
				}
				else  {
					s = s + (this.x[i]/t) * (this.x[i]/t);
				}
			}
		}
		
		// Final normalization of the computed coordinates of the point being sampled, so that
		// the associated vector in R^n belongs to the n-hypersphere, i.e. its 2-norm 
		// is equal to 1.
		var x_two_norm = t * Math.sqrt(s);
		for (var i = 0; i < this.n; ++i) {
			this.x[i] = this.x[i]/x_two_norm;
		}
	
		// Return a copy of the point being sampled, so that callers can alter it.
		return this.x.slice(0);
	}
}
 

/**
* @function simplexRationalRounding_
*
* @summary Compute a closest rational point on the unit simplex.
*
* @description Given a point x = (x_1,...,x_n) on the unit simplex of R^n, this function computes a proximal point xr = (xr_1,...,xr_n) on 
* the r-th rational grid of the unit simplex of R^n, 1/r * I_n(r), with I_n(r) the set of N^n containing the points m = (m_1,...,m_n) 
* statisfying sum m_i = r with r a strictly positive natural integer, so that the computed proximal point xr is one of the closest points to x 
* on this grid with respect to any norm in a large class, c.f. the first reference.
*
* @see <a href="https://doi.org/10.1007/s10898-013-0126-2">M. Bomze, S. Gollowitzer, and E.A. Yıldırım, Rounding on the unit simplex: 
* Regular grids for global optimization, J. Global Optim. 59 (2014), pp. 243–258</a>
* @see <a href="https://arxiv.org/abs/1501.00014">Rama Cont, Massoud Heidari, Optimal rounding under integer constraints</a>
* 
* @param {Array.<number>} x a point belonging to the unit simplex of R^n, array of n real numbers.
* @param {number} r the indice of the rational grid of the unit simplex of R^n, 1/r * I_n(r), on which to compute the closest point to x, natural integer greater than or equal to 1.
* @return {Array.<number>} the computed closest point to x on the r-th rational grid of the unit simplex of R^n, array of n real numbers.
*
* @example
* simplexRationalRounding_([0.5759, 0.0671, 0.3570], 20);
* // [0.6, 0.05, 0.35]
*/
function simplexRationalRounding_(x, r) {
	// TODO: Checks, if enabled

	// Compute the integer and fractional parts of the coordinates of the input point multiplied by r, 
	// as described in paragraph 2 of the first reference.
	// In parallel, compute k as also defined in paragraph 2 of the first reference. 
	var k = r;
	var xPartsWithIndexes = new Array(x.length);
	for (var i = 0; i < x.length; ++i) {
		//
		var rx = r * x[i];
		var integerPart = Math.floor(rx);
		var fractionalPart = rx - integerPart;
		
		//
		k -= integerPart;
		
		//
		xPartsWithIndexes[i] = [integerPart, fractionalPart, i];
	}

	// Re-order the coordinates according to decreasing values of the fractional parts, 
	// c.f. theorem 1 of the first reference.
	// In case the fractional parts are equal, re-order the coordinates according to 
	// decreasing values of the integer parts, c.f. paragraph 3 of the second reference.
	xPartsWithIndexes.sort(function(a, b) {
		if (b[1] < a[1]) {
			return -1;
		}
		else if (b[1] > a[1]) {
			return 1;
		}
		else { // coordinates have equal fractional parts
			return b[0] - a[0];
		}
	}); 

	// Rounding rule: round the k largest fractional parts up to one and all other fractional parts down to zero,
	// as described in paragraph 2 of the first reference.
	var xr = new Array(x.length);
	for (var i = 0; i < k; ++i) {
		var index = xPartsWithIndexes[i][2];
		xr[index] = (xPartsWithIndexes[i][0] + 1) / r;
	}
	for (var i = k; i < xPartsWithIndexes.length; ++i) {
		var index = xPartsWithIndexes[i][2];
		xr[index] = xPartsWithIndexes[i][0] / r;
	}

	// Return the computed point
	return xr;
}

/**
* @function simplexGridSearch_
*
* @summary Compute the point(s) minimizing a real-valued function of several real variables
* defined on the unit simplex using a grid search algorithm.
*
* @description This function returns the list of points x = (x_1,...,x_n) belonging to the unit simplex of R^n which 
* minimize a real-valued function fct of n real variables defined on the unit simplex of R^n, 
* using a grid search algorithm on the k-th rational grid of the unit simplex of R^n, 1/k * I_n(k), 
* c.f. the reference.
*
* Optionally, lower bounds and upper bounds constraints can be added to the problem, in which case 
* the unit simplex becomes a restricted unit simplex.
*
* To be noted that per lemma 1 of the reference, the number of points on the k-th rational grid
*  of the unit simplex of R^n is equal to factorial(n + k - 1) / (factorial(k - 1) * factorial(n)), 
* i.e., binomial(n+k-1, n-1), so that this method might be of limited use, even for small n.
*
* For instance, n=5 and k=100 already result in 4598126 points on which to evaluate f.
*
* To also be noted that as the optional lower and upper bounds contraints become tigter,
* the volume of the restricted simplex becomes smaller, so that this method might also be of limited use
* because most of the grid points will fall outside of the restricted simplex. 
*
* @see <a href="https://ideas.repec.org/p/cor/louvco/2003071.html">Nesterov, Yurii. Random walk in a simplex and 
* quadratic optimization over convex polytopes. CORE Discussion Papers ; 2003/71 (2003)</a>
* @see <a href="https://doi.org/10.1016/S0167-7152(99)00095-4">Kai-Tai Fang, Zhen-Hai Yang, On uniform design of experiments with restricted
* mixtures and generation of uniform distribution on some domains, Statistics & Probability Letters, Volume 46, Issue 2, 
* 15 January 2000, Pages 113-120</a>
*
* @param {function} f, a function which must take as input argument
* an array of n real numbers corresponding to a point on the unit simplex of R^n and which must return as output a real number 
* corresponding to f(x).
* @param {number} n the number of variables of the function f, natural integer superior or equal to 1.
* @param {number} k the indice of the rational grid of the unit simplex of R^n on which to minimize the function f, 
* a natural integer superior or equal to 1.
* @param {Array.<number>} l the optional lower bounds contraints, an array of n real numbers l_i which must satisfy 0 <= l_i <= u_i <= 1, i = 1..n; defaults to an array made of zeros.
* @param {Array.<number>} u the optional upper bounds contraints, an array of n real numbers u_i which must satisfy 0 <= l_i <= u_i <= 1, i = 1..n; defaults to an array made of ones.
* @return {Array.<Array.<number>>} an array of possibly several arrays of n real numbers, each array of n real numbers
* corresponding to a point of R^n minimizing the function f on the k-th rational grid of the unit simplex of R^n.
*
* @example
* // Minimize f(x,y) = x on the unit simplex of R^2, using the 10-th rational grid
* simplexGridSearch_(function(arr) { return arr[0]; }, 2, 10); 
* // [[0,1]]
*/
function simplexGridSearch_(f, n, k, l, u) {
	// Misc. checks on the optional lower and upper bounds
	var lowerBounds = null;
	var upperBounds = null;
	if (l) {
		lowerBounds = l; // no input checks
		
		if (!u) {
			upperBounds = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n);
			
			// Initialization to an array of ones
			for (var i = 0; i < n; ++i) {
				upperBounds[i] = 1;
			}
		}
	}
	if (u) {
		upperBounds = u; // no input checks
		
		if (!l) {
			lowerBounds = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n);

			// Initialization to an array of zeros
			for (var i = 0; i < n; ++i) {
				lowerBounds[i] = 0;
			}
		}
	}
	
	// Emptiness check on the restricted simplex.
	//
	// In case the restricted simplex is empty, an exception is thrown, so that
	// the process is (violently) stopped here.
	if (lowerBounds || upperBounds) {
		var sumBounds = simplexEmptinessCheck_(n, lowerBounds, upperBounds);
	}
	
	// Initialize the current minimum value and the current list of associated grid points
	var minValue = Number.POSITIVE_INFINITY;
	var minValueGridPoints = [];

	// Proceed to an exhaustive grid search on the set 1/k * I_n(k), c.f. the reference.
	var sampler = new simplexGridSampler_(n, k, true); // use no array copy in the simplex grid sampler to improve performances
	var weights = sampler.sample();
	while (weights !== -1) {  
		// Optionally reject the current grid point if it does not belong to the restricted simplex,
		// and generate a new grid point
		var withinBounds = true;
		if (lowerBounds) {
			for (var i = 0; i < n; ++i) {
				if (lowerBounds[i] > weights[i]) {
					withinBounds = false;
					break;
				}
			}
		}
		if (upperBounds) {
			for (var i = 0; i < n; ++i) {
				if (weights[i] > upperBounds[i]) {
					withinBounds = false;
					break;
				}
			}
		}
		if (!withinBounds) {
			weights = sampler.sample();
			continue;
		}
		
		
		// Evaluate the function f at the current grid point
		var fctValue = f(weights);
	  
	  
		// If the function value at the current grid point is lower than the current minimum value, this value
		// becomes the new minimum value and the current grid point becomes the new (unique for now) associated grid point.
		if (fctValue < minValue) {
			minValue = fctValue;
			minValueGridPoints = [weights.slice(0)];
		}
		// In case of equality of the function value at the current grid point with the current minimum value, 
		// the current grid point is added to the list of grid points associated to the current minimum value.
		else if (fctValue == minValue) {
			minValueGridPoints.push(weights.slice(0));
		}
		// Otherwise, nothing needs to be done
		

		// Generate a new grid point
		weights = sampler.sample();
	}
	
	// Return the list of grid points associated to the minimum value of f
	return minValueGridPoints;
}

/**
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 


/**
* @function bestConstantlyRebalancedWeights
*
* @summary Compute the weights of the best constantly rebalanced portfolio.
* 
* @description This function returns the weights w_1,...,w_n associated to the 
* the best constantly rebalanced portfolio, which is the portfolio of n assets 
* rebalanced at each period of time so that it holds the same proportion of each assets 
* and with the best return in hindsight, c.f. the reference.
*
* Optionally, the following constraints can be added:
* - Minimum weight of each asset that is included in the portfolio
* - Maximum weight of each asset that is included in the portfolio
*
* @see <a href="https://doi.org/10.1109/18.485708">T. M. Cover, Erik Ordentlich, Universal portfolios with side information, 
* IEEE Transactions on Information Theory, Volume 42, Issue 2 March 1996</a>
* 
* @param {Array.<Array.<number>>} priceRelatives an array of n arrays of T real numbers, with 
* priceRelatives[i-1][j-1] the ratio of the final price to the initial price of the i-th asset
* for the j-th period of time, i = 1..n, j = 1..T.
* @param {object} opt optional parameters for the algorithm.
* @param {number} opt.eps the tolerance parameter for the convergence of the algorithm, a strictly positive real number; defaults to 1e-04.
* @param {number} opt.maxIter the maximum number of iterations of the algorithm, a strictly positive natural integer; defaults to 10000.
* @param {Array.<number>} opt.constraints.minWeights an optional array of size n (l_i),i=1..n containing the minimum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of zeros.
* @param {Array.<number>} opt.constraints.maxWeights an optional array of size n (u_i),i=1..n containing the maximum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of ones.
* @return {Array.<number>} the weights corresponding to best constantly rebalanced portfolio, array of n real numbers.
*
* @example
* bestConstantlyRebalancedWeights([[1 - 0.05, 1 - 0.05], [1, 1], [1 + 0.05, 1 + 0.05]]);
* // [0, 0, 1]
*/
self.bestConstantlyRebalancedWeights = function (priceRelatives, opt) {
	// Initialize the options structure
	if (opt === undefined) {
		opt = { constraints: {} };
	}
	if (opt.constraints  === undefined) {
		opt.constraints = {};
	}

	// Initialize the options default values
	if (opt.eps === undefined) {
		opt.eps = 1e-04;
	}
	if (opt.maxIter === undefined) {
		opt.maxIter = 10000;
	}
	
	// Decode the options
	var eps = opt.eps;
	var maxIterations = opt.maxIter;
	var lowerBounds = opt.constraints.minWeights;
	var upperBounds = opt.constraints.maxWeights;
	
	
	// ------
	
	
	// Initializations
	var nbAssets = priceRelatives.length; // m in the reference
	var nbPeriods = priceRelatives[0].length; // n in the reference

	
	// ----
	
	
	// The best constantly rebalanced portfolio is a solution to the following
	// smooth constrained concave optimization problem, c.f. formula 6 of the reference:
	//
	// argmax S_n(b) = argmax ( <b/x_1> * ... * <b/x_n> )
	// s.t. sum b_i = 1
	//      l <= b <= u
	//      (i.e., b belongs to a restricted unit simplex)
	//
	// This optimization problem will be solved using a first-order method
	// for convex minimization, using the facts that:
	// - argmax S_n(b) = argmin -S_n(b)
	// - The restricted unit simplex is a convex set	
	// - -S_n(b) is a convex function on the restricted unit simplex (for instance, it
	//   is log-convex)

	// Define the function representing -S_n(b)
	function f(b) {
		// Initialize the placeholder for the price relatives of all the assets at period k
		var x_k = Matrix_.zeros(nbAssets, 1);

		// Computation of the cumulative product of all the portfolio relatives 
		// <b/x_k>, k = 1..nbPeriods
		var prodPortfolioRelatives = 1.0;
		for (var k = 0; k < nbPeriods; ++k) {
			// Extract the price relatives x_k for all the assets for the period k
			x_k = Matrix_.fill(nbAssets, 1, function(i,j) { return priceRelatives[i-1][k]; }, x_k);
			
			// Compute the portfolio relative <b/x_k> and add it to the cumulative product
			prodPortfolioRelatives *= Matrix_.vectorDotProduct(b, x_k);
		}
		
		// Return the computed function value
		return -prodPortfolioRelatives;
	}
	
	// Define the function representing the gradient of the function -S_n(b).
	//
	// By the multiplicative rule, we have for j = 1..m:
	//
	// d S_n /d b_j (b) = sum_k ( x_k,j * ( Prod_i <b/x_i>, i = 1..n, i<>k ) ), k = 1..n,
	// which is a function costly to evaluate for big m/big n.
	//
	// In case the portfolio relatives <b/x_i>, i = 1..n, are non null (general case),
	// an optimized formula is used.
	function gradf(b) {		
		// Initialize the placeholder for the price relatives of all the assets at period k
		var x_k = Matrix_.zeros(nbAssets, 1);
		
		// Preliminary computation of all the portfolio relatives <b/x_k>, k = 1..nbPeriods,
		// as well as their cumulative product (optimized formula only).
		var portfolioRelatives = typeof Float64Array === 'function' ? new Float64Array(nbPeriods) : new Array(nbPeriods);
		var prodPortfolioRelatives = 1.0;
		var nullPortfolioRelatives = false;
		for (var k = 0; k < nbPeriods; ++k) {
			// Extract the price relatives x_k for all the assets for the period k
			x_k = Matrix_.fill(nbAssets, 1, function(i,j) { return priceRelatives[i-1][k]; }, x_k);
			
			// Compute the portfolio relative <b/x_k>
			var b_d_x_k = Matrix_.vectorDotProduct(b, x_k);
			
			// Save the portfolio relative for future usage
			portfolioRelatives[k] = b_d_x_k;

			// Optimized formula only
			if (nullPortfolioRelatives === false) {
				// Add the portfolio relative to the cumulative product
				prodPortfolioRelatives *= b_d_x_k;
			
				// Determine if the portfolio relative is numerically close to 0,
				// in which case the optimized computation of the gradient of the
				// function S_n(b) cannot be used.
				if (Math.abs(b_d_x_k) <= 1e-12) {
					nullPortfolioRelatives = true;
				}
			}
		}
		
		// Compute the nbAssets products Prod_i <b/x_i>, i = 1..nbPeriods, i <> k, with k = 1..nbAssets:
		//
		// - Optimized formula: if there is no <b/x_k> such that <b/x_k> ~= 0, then the formula
		// Prod_i <b/x_i>, i = 1..nbPeriods / <b/x_k> == Prod_i <b/x_i>, i = 1..nbPeriods, i <> k
		// is used.
		//
		// - Non-optimized formula: Unsupported for now.
		var partialPortfolioRelatives;
		if (nullPortfolioRelatives === false) {
			partialPortfolioRelatives = Matrix_.fill(nbPeriods, 1, 
			                                         function(i,j) { return prodPortfolioRelatives / portfolioRelatives[i-1]; });
		}
		else {
			throw new Error('null portfolio relative detected, unsuported case');
		}

		// Initialize the placeholder for the all the price relatives of the asset k
		var xx_k = Matrix_.zeros(nbPeriods, 1);
		
		// Compute the gradient
		var res = Matrix_.zeros(nbAssets, 1);
		for (var k = 0; k < nbAssets; ++k) {
			// Extract all the price relatives xx_k of the asset k
			xx_k = Matrix_.fill(nbPeriods, 1, function(i,j) { return priceRelatives[k][i-1]; }, xx_k);
			
			// Compute the k-th coordinate of the gradient
			res.data[k] = -Matrix_.vectorDotProduct(xx_k, partialPortfolioRelatives);
		}

		// Return the computed gradient
		return res;
	}

	// Define the characteristic function of the restricted unit simplex
	function g(b) {
		return simplexCharacteristicFunction_(b.data, lowerBounds, upperBounds);
	}
	
	// Define the proximal function associated to g, which is the orthogonal
	// projection on the restricted simplex.
	function proxg(b) {
		return new Matrix_(simplexEuclidianProjection_(b.data, lowerBounds, upperBounds));
	}
	
	// Define the initial point as the projection of the 1 vector 
	// on the restricted unit simplex.
	var x0 = new Matrix_(simplexEuclidianProjection_(Matrix_.ones(nbAssets, 1).data, lowerBounds, upperBounds));

	// Solve the convex optimization program above
	var sol = ccpsolveFISTA_(f, gradf, g, proxg, x0, {eps: eps, maxIter: maxIterations, maxLine: maxIterations});

	
	// ----
	
	
	// Extract the solution, which is the computed portfolio weights
	var weights = sol[0];

	// Return the computed weights
	return weights.toArray();
}


/**
 * @file Functions related to cluster risk parity portfolio.
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 


/**
* @function clusterRiskParityWeights
*
* @summary Compute the weights of the cluster risk parity portfolio.
*
* @description This function returns the weights w_1,...,w_n associated to the fully invested and long-only 
* cluster risk parity portfolio of n assets, as computed by the cluster risk parity algorithm described in 
* the reference.
*
* This algorithm combines the use of a clustering method to isolate groups of assets and then allocate 
* both within and across these groups using equal risk contribution (ERC) weights.
*
* To be noted that the choice of the clustering method is not detailled in the reference, so that two possibilites
* are offered by this function:
* - (Default) Using automatically the Fast Threshold Clustering Algorithm (FTCA) from David Varadi, c.f. the ftca_ function.
* - Using a list of clusters provided by the user, typically constructed with the clustering algorithm of her choice
* 
* This portfolio is unique, provided the covariance matrix of the assets is definite positive.
* 
* @see <a href="https://cssanalytics.wordpress.com/2013/01/03/cluster-risk-parity/">Cluster Risk Parity</a>
* 
* @param {Matrix_|Array.<Array.<number>>} sigma the covariance matrix (sigma_ij),i,j=1..n of the n assets in the considered universe, square n by n Matrix or array of n arrays of n real numbers statisfying sigma[i-1][j-1] = sigma_ij.
* @param {object} opt the optional parameters for the algorithms used by the function.
* @param {number} opt.eps the tolerance parameter for the convergence of the ERC algorithms, a strictly positive real number; defaults to 1e-8.
* @param {number} opt.maxIter the maximum number of iterations of the ERC algorithms, a strictly positive natural integer; defaults to 10000.
* @param {number} opt.clusteringMode the method to use for the clusters computation, a string either equals to:
* - 'ftca': usage of the list of clusters automatically constructed by the FTCA algorithm from David Varadi
* - 'manual': usage of a list of clusters provided in input in the opt.clusters option
* ; defaults to 'ftca'.
* @param {number} opt.ftcaThreshold the correlation threshold to use in the FTCA algorithm in case opt.clusteringMode is equal to 'ftca', a real number beloning to [0,1]; defaults to 0.5.
* @param {Array.<Array.<number>>} opt.clusters the list of clusters to use in the algorithm in case opt.clusteringMode is equal to 'manual', an array of m arrays of strictly positive integers representing the indexes of the assets in the considered universe, where m is the number of clusters, with the m arrays forming a partition of the set [1..n].
* @return {Array.<number>} the weights corresponding to the cluster risk parity portfolio, array of n real numbers.
*
* @example
* clusterRiskParityWeights([[0.1,0], [0,0.2]], {clusteringMode: 'manual', clusters: [[1], [2]]});
*  
*/
self.clusterRiskParityWeights = function (sigma, opt) {
	// Decode options
	if (opt === undefined) {
		opt = {};
	}
	
	// Clustering options
	var clusteringMode = opt.clusteringMode || 'ftca';
	
	// Convert sigma to matrix format and convert it to acovariance matrix
	var sigma = new Matrix_(sigma).toCovarianceMatrix(sigma);
	var nbAssets = sigma.nbRows;

	
	// ------
	// Clustering logic
	var clusters = [];
	
	// In case clusters are provided, check that they form a partition of the set [1..nbAssets]
	if (clusteringMode === 'manual') {
		// Decode the manual clustering options
		clusters = opt.clusters || [];
		
		// Prepare a partition of the set of integers [1..nbAssets]
		var partition = new Array(nbAssets);
		for (var i = 0; i < partition.length; ++i) {
		    partition[i] = 0;
		}
		
		// Count the number of times each asset index appears in the list of clusters
	 	for (var j = 0; j < clusters.length; ++j) {
	        // Detect empty clusters
			if (clusters[j].length === 0) {
				throw new Error('empty cluster at index: ' + j);
			}
			
			// Detect out of bounds asset indexes
			// Count the number of times each asset index appears in the list of clusters
			for (var k = 0; k < clusters[j].length; ++k) {
	            var assetIdx = clusters[j][k];
	            if (assetIdx < 1 || assetIdx > nbAssets) {
	                throw new Error('asset index out of bounds: ' + assetIdx);
	            }
	            else {
	                partition[assetIdx-1]++;
	            }
	        }
	    }
		    
		// Check that each integer in the set [1..nbAssets] appears once and only once 
		// in the list of clusters
		for (var i = 0; i < partition.length; ++i) {
		    if (partition[i] !== 1) {
		        if (partition[i] === 0) {
		            throw new Error('missing asset index: ' + (i+1));
		        }
		        else if (partition[i] > 1) {
		            throw new Error('duplicate asset index: ' + (i+1));
		        }
		        else {
		            throw new Error('unknown error');
		        }
		    }
		}

		// All checks passed
	}
	// Otherwise, compute the clusters using the Fast Threshold Clustering Algorithm from David Varadi
	else if (clusteringMode === 'ftca') {
		// Extract the correlation matrix from the covariance matrix, as a double array
		var corrMat = sigma.getCorrelationMatrix().toRowArray();
		
		// Compute the clusters using the FTCA algorithm
		clusters = ftca_(corrMat, opt.ftcaThreshold);
	}
	else {
		//
		throw new Error('unsupported clustering method');
	}
	

	// ------
	// The cluster risk parity portfolio is constructed in three steps:
	// 1 - Clusters creation (done above)
	// 2 - Assets allocation within each cluster using ERC weights
	// 3 - Portfolio allocation across all clusters using ERC weights and considering each cluster as a (synthetic) asset
	
	// 1 - N/A
	var nbClusters = clusters.length;
	
	// Instantiate the matrix mapping the initial assets to the clusters space (e.g., a change of base matrix),
	// to be populated with proper weights in step 2 below.
	var assetsToClustersWeights = Matrix_.zeros(nbClusters, nbAssets); 
	
	// 2 - For each cluster:
	for (var i = 0; i < nbClusters; ++i) {
		// Extract the covariance matrix associated to the assets it contains 
		var assetsIndexes = clusters[i].slice().sort(function(a, b) { return a - b; });
		
		var clusterSigma = sigma.submatrix(assetsIndexes, assetsIndexes);
		
		// Compute ERC weights for these assets
		var assetsWeights = self.equalRiskContributionWeights(clusterSigma, opt);
		
		// - Populate the change of base matrix for the current cluster with the computed ERC weights
		for (var j = 0; j < assetsWeights.length; ++j) {
			assetsToClustersWeights.setValueAt(i+1, assetsIndexes[j], assetsWeights[j]);
		}
	}
	
	// 3a - Compute the the covariance matrix associated to the weighted clusters space, using formula Var(A*X) = A * Var(X) * A'.
	var clustersSigma = Matrix_.xy(assetsToClustersWeights, Matrix_.axty(1, sigma, assetsToClustersWeights));
	
	// 3b - Compute ERC weights in the clusters space
	var clustersWeights = self.equalRiskContributionWeights(clustersSigma, opt);
	
	// 3c - Compute original assets weights, using formula A' * Y
	var weights = Matrix_.txy(assetsToClustersWeights, new Matrix_(clustersWeights));
	
	// Return them (already normalized)
	return weights.toArray();
}


/**
 * @file Functions related to equal risk bounding portfolio.
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 


/**
* @function equalRiskBoundingWeights
*
* @summary Compute the weights of the equal risk bounding portfolio.
*
* @description This function returns the weights w_1,...,w_n associated to the fully invested and long-only portfolio
* of n assets with equal risk bounding, defined as the portfolio for which the contribution of each asset 
* included in the portfolio to the risk of the portfolio is equal, c.f. the reference.
*
* A property of the equal risk bounding portfolio is that it is either equal to the equal risk contribution portfolio
* (if all the assets are included in the portfolio), or to a portfolio with a smaller variance than the 
* equal risk contribution portfolio and for which the risk contribution of each asset included in the 
* portfolio is strictly smaller than in the equal risk contribution portfolio (if some assets are not included
* in the portfolio).
*
* Hence, the equal risk bounding portfolio is an equal risk contribution portfolio restricted
* to a (possibly strict) subset of the n assets.
*
* This portfolio is unique, provided the covariance matrix of the assets is definite positive.
* 
* The algorithm used to solve the associated optimisation problem is an exhaustive computation of all the ERC portfolios
* defined on all the 2^n subsets of the n assets.
* This approach is expected to produce a solution within a reasonable amount of time for small n (e.g. n <= 20),
* but due to the combinatorial nature of the problem, the computation for greater values of n will not be tractable.
*
* @see <a href="https://doi.org/10.1007/s10898-016-0477-6">Cesarone, F. & Tardella F., Equal Risk Bounding is better than Risk Parity for portfolio selection, J Glob Optim (2017) 68: 439</a>
* 
* @param {Matrix_|Array.<Array.<number>>} sigma the covariance matrix (sigma_ij),i,j=1..n of the n assets in the considered universe, square Matrix or array of n array of n real numbers statisfying sigma[i-1][j-1] = sigma_ij.
* @param {object} opt the optional parameters for the algorithm.
* @param {number} opt.eps the tolerance parameter for the convergence of the underlying ERC algorithm, a strictly positive real number; defaults to 1e-8.
* @param {number} opt.maxIter the maximum number of iterations of the underlying ERC algorithm, a strictly positive natural integer; defaults to 10000.
* @return {Array.<number>} the weights corresponding to the equal risk bounding portfolio, array of n real numbers.
*
* @example
* equalRiskBoundingWeights([[1,-9/10, 3/5], [-9/10, 1,-1/5],[ 3/5, -1/5, 4]]);
* // [0.5, 0.5, 0]
*/
self.equalRiskBoundingWeights = function (sigma, opt) {	
	// Create the options structure, if not defined,
	// and request the portfolio volatility to be providede
	// in output of the ERC algorithm.
	if (opt === undefined) {
		opt = {};
	}
	opt.outputPortfolioVolatility = true;
	
	// Convert sigma to matrix format
	var sigma = new Matrix_(sigma);
	
	// Determine the size of the universe
	var nbAssets = sigma.nbRows;
	
	// Initialize the current minimum value of the risk contribution and the current list of associated assets/assets weights
	var minRCValue = Infinity;
	var minRCAssetsIndexes = [];
	var minRCAssetsWeights = [];

	// Proceed to an exhaustive enumeration of all the subsets of the set {1,...,nbAssets},
	// in order to find the x^ERB as detailled in section 3.3.1, formula 22, of the reference.
	//
	// The empty set is skipped.
	var nextSubsetIterator = new subsetsIterator_(nbAssets);
	var nextSubset = nextSubsetIterator.next(); // empty set
	var nextSubset = nextSubsetIterator.next(); // "true" first set
	while (nextSubset != -1) {	
		// Extract the selected assets indexes
		var subsetAssetsIdx = nextSubset;
		
		// Extract the covariance matrix of the selected assets
		var subsetSigma = sigma.submatrix(subsetAssetsIdx, subsetAssetsIdx);
		
		// Compute ERC weights for the selected assets
		var sol = self.equalRiskContributionWeights(subsetSigma, opt);
		var subsetAssetsWeights = sol[0];
		var subsetPortfolioVolatility = sol[1];

		// Compute lambda_erc, c.f. the formula following the formula 3 of the reference.
		var rcValue = subsetPortfolioVolatility * subsetPortfolioVolatility / subsetAssetsIdx.length;
		
		// If the risk contribution of the current subset is lower than the current minimum risk contribution, it
		// becomes the new minimum risk contribution and the current subset becomes the new list of selected assets.
		if (rcValue < minRCValue) {
			minRCValue = rcValue;
			minRCAssetsIndexes = subsetAssetsIdx;
			minRCAssetsWeights = subsetAssetsWeights;
		}
		// Otherwise, nothing needs to be done
	
		// Generate a new subset	
		var nextSubset = nextSubsetIterator.next();
	}
	
	// Compute the original assets weights, following formula 22 of the reference
	var weights = Matrix_.zeros(nbAssets, 1);
	for (var i = 0; i < minRCAssetsIndexes.length; ++i) {
		weights.setValueAt(minRCAssetsIndexes[i], 1, 
		                   minRCAssetsWeights[i]);
	}
	
	// Return the computed weights (already normalized)
	return weights.toArray();
}


/**
 * @file Functions related to equal risk contributions portfolio.
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 


/**
* @function equalRiskContributionWeights
*
* @summary Compute the weights of the equal risk contribution portfolio.
*
* @description This function returns the weights w_1,...,w_n associated to the fully invested and long-only portfolio
* of n assets with equal risk contributions.
*
* This portfolio has the property that the contribution of each asset to the risk of the portfolio is equal,
* and is a special case of the more generic risk budgeting portfolio, with all risk budgets
* equal, c.f. the first reference.
*
* This portfolio is unique, provided the covariance matrix of the assets is definite positive.
*
* Optionally, the following constraints can be added:
* - Minimum weight of each asset that is included in the portfolio
* - Maximum weight of each asset that is included in the portfolio
*
* To be noted that in case weights constraints are defined, the concept of "equal risk contribution"
* does not make any sense, c.f. the third reference.
*
* The algorithm used internally is a cyclical coordinate descent, c.f. the second reference, whose convergence is guaranteed
* if the covariance matrix of the assets is semi-definite positive.
*
* @see <a href="https://doi.org/10.3905/jpm.2010.36.4.060">Maillard, S., Roncalli, T., Teiletche, J.: The properties of equally weighted risk contribution portfolios. J. Portf. Manag. 36, 60–70 (2010)</a>
* @see <a href="https://arxiv.org/abs/1311.4057">Théophile Griveau-Billion, Jean-Charles Richard, Thierry Roncalli; A Fast Algorithm for Computing High-dimensional Risk Parity Portfolios. eprint arXiv:1311.4057</a>
* @see <a href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3331184">RONCALLI Thierry, RICHARD Jean-Charles, CONSTRAINED RISK BUDGETING PORTFOLIOS, </a>
*
* @param {Matrix_|Array.<Array.<number>>} sigma the covariance matrix (sigma_ij),i,j=1..n of the n assets in the considered universe, square Matrix or array of n array of n real numbers statisfying sigma[i-1][j-1] = sigma_ij.
* @param {object} opt the optional parameters for the algorithm.
* @param {number} opt.eps the tolerance parameter for the convergence of the algorithm, a strictly positive real number; defaults to 1e-8.
* @param {number} opt.epsSdp the tolerance parameter for testing the semi-definite positiveness of the covariance matrix, a strictly positive real number; defaults to 1e-12.
* @param {number} opt.maxCycles the maximum number of cycles of the algorithm, a strictly positive natural integer; defaults to 10000.
* @param {number} opt.nbCycles the exact number of cycles of the algorithm, a strictly positive natural integer, in which case the values of opt.eps and opt.maxCycles are discarded,
* or -1; defaults to -1.
* @param {boolean} opt.outputPortfolioVolatility a boolean indicating whether the portfolio volatility should be provided in output
* (if set to true) or not (if set to false); defaults to false.
* @param {Array.<number>} opt.constraints.minWeights an array of size n (l_i),i=1..n containing the minimum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of zeros.
* @param {Array.<number>} opt.constraints.maxWeights an array of size n (u_i),i=1..n containing the maximum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of ones.
*
* @return {Array.<number>|Array.<Array.<number>>} if opt.outputPortfolioVolatility is set to false, the weights corresponding to the equal risk contribution portfolio, 
* array of n real numbers, and if opt.outputPortfolioVolatility is set to true, an array arr of two elements:
* - arr[0], the weights corresponding to the equal risk contribution portfolio, array of n real numbers
* - arr[1], the volatility of the computed equal risk contribution portfolio, a real number
*
* @example
* equalRiskContributionWeights([[0.1,0], [0,0.2]]);
* // ~[0.59, 0.41]
*/
self.equalRiskContributionWeights = function (sigma, opt) {	
	// The ERC portfolio is a specific case of the more general risk budgeting portfolio, with equal risk budgets.
	//
	// Generate equal risk budgets: rb_i = 1/nbAssets, i=1..nbAssets
	var sigma = new Matrix_(sigma);
	var nbAssets = sigma.nbRows;
	var rb = Matrix_.fill(nbAssets, 1, function (i,j) { return 1/nbAssets; });

	// Compute the associated risk budgeting weights
	return self.riskBudgetingWeights(sigma, rb, opt);
}


/**
  * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 


/**
* @function equalWeights
*
* @summary Compute the weights of the equally weighted portfolio.
*
* @description This function returns the weights w_1,...,w_n associated to the fully invested and long-only portfolio
* of n assets with equal weights, defined as w_i = 1/n, i=1..n.
*
* This portfolio is unique.
*
* @see <a href="https://doi.org/10.1093/rfs/hhm075">Victor DeMiguel, Lorenzo Garlappi, Raman Uppal; Optimal Versus Naive Diversification: How Inefficient is the 1/N Portfolio Strategy?. Rev Financ Stud 2009; 22 (5): 1915-1953. doi: 10.1093/rfs/hhm075</a>
* 
* @param {number} nbAssets the number of assets in the universe, natural integer superior or equal to 1.
* @param {object} opt the optional parameters for the algorithm, unused.
* @return {Array.<number>} the weights corresponding to the equally weighted portfolio, array of real numbers of length nbAssets.
*
* @example
* equalWeights(5);
* // [0.2, 0.2, 0.2, 0.2, 0.2]
*/
self.equalWeights = function (nbAssets, opt) {
	// TODO: Checks, if enabled
	// Check that nbAssets is a strictly positive natural integer

	// Allocate the weights vector: all the weights are equal to 1/nbAssets
	var weights = Matrix_.fill(nbAssets, 1, function(i,j) { return 1/nbAssets; });

	// Return the computed weights
	return weights.toArray();
}


/**
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 


/**
* @function globalMinimumVarianceWeights
*
* @summary Compute the weights of the global minimum variance portfolio.
*
* @description This function returns the weights w_1,...,w_n associated to the fully invested and 
* long-only global minimum variance portfolio of n assets.
*
* Optionally, the following constraints can be added:
* - Minimum weight of each asset that is included in the portfolio
* - Maximum weight of each asset that is included in the portfolio
*
* This portfolio is the portfolio with the lowest volatility among all the feasible portfolios.
*
* This portfolio is unique and is mean-variance efficient when the covariance matrix 
* of the assets is definite positive.
* 
* The algorithm used internally is a sequential minimization optimization algorithm,
* which is similar to a cyclical coordinate descent algorithm updating 2 coordinates at each iteration, 
* c.f. the first reference, and whose convergence is guaranteed as long as the covariance matrix
* is positive semi-definite
*
* In a previous version of the code, the algorithm used internally was a coordinate descent algorithm,
* c.f. the second reference, kept for historical reference.
*
* @see <a href="https://link.springer.com/article/10.1023/A:1012431217818">Keerthi, S. & Gilbert, E. Convergence of a Generalized SMO Algorithm for SVM Classifier Design Machine Learning (2002) 46: 351.</a>
* @see <a href="https://ssrn.com/abstract=2595051">Richard, Jean-Charles and Roncalli, Thierry, Smart Beta: Managing Diversification of Minimum Variance Portfolios (March 2015)</a>
* 
* @param {Matrix_|Array.<Array.<number>>} sigma the covariance matrix (sigma_ij),i,j=1..n of the n assets in the considered universe, square Matrix or array of n array of n real numbers statisfying sigma[i-1][j-1] = sigma_ij.
* @param {object} opt the optional parameters for the algorithm.
* @param {number} opt.eps the tolerance parameter for the convergence of the algorithm, a strictly positive real number; defaults to 1e-08.
* @param {number} opt.maxIter the maximum number of iterations of the algorithm, a strictly positive natural integer; defaults to 10000.
* @param {Array.<number>} opt.constraints.minWeights an optional array of size n (l_i),i=1..n containing the minimum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of zeros.
* @param {Array.<number>} opt.constraints.maxWeights an optional array of size n (u_i),i=1..n containing the maximum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of ones.
* @return {Array.<number>} the weights corresponding to the global minimum variance portfolio, array of n real numbers.
*
* @example
* globalMinimumVarianceWeights([[0.0400, 0.0100], [0.0100, 0.0100]], {eps: 1e-10, maxIter: 10000});
* // [0, 1]
*/
self.globalMinimumVarianceWeights = function (sigma, opt) {
	// Initialize the options structure
	if (opt === undefined) {
		opt = {};
	}
	if (opt.constraints === undefined) {
		opt.constraints = {};
	}
	
	// Initialize the options default values
	if (opt.eps === undefined) {
		opt.eps = 1e-08;
	}
	if (opt.maxIter === undefined) {
		opt.maxIter = 10000;
	}

	// Decode the options
	var eps = opt.eps;
	var maxIterations = opt.maxIter;
	var lowerBounds = opt.constraints.minWeights;
	var upperBounds = opt.constraints.maxWeights;
	
	// Convert sigma to matrix format
	var sigma = new Matrix_(sigma);
	
	// TODO: Checks, if enabled
	// Check that diagonal entries of sigma are strictly positive
	// Check that sigma is symmetric and positive definite
	// Check that sigma and rb are rows compatible
	// Check lower/upper bounds are finite, between 0 and 1

	// ------
	
	// Initializations
	var nbAssets = sigma.nbRows;
	var zeros = Matrix_.zeros(nbAssets, 1);
	var ones = Matrix_.ones(nbAssets, 1);
	
	
	// ----
	
	// The global minimum variance portfolio is the solution to a constrained convex quadratic
	// program (e.g., the associated matrix is positive semi-definite, since this is
	// a covariance matrix, and the constraints set is a constrained unit simplex).
	
		// Build the matrix and the vector of the quadratic program
	var Q = sigma;
	var p = zeros;
	
		// Build the linear equality constraint:
		// - Full investment
	var b = ones;
	var r = 1;
	
		// Build the bound constraints:
		// - By default, no short sales
		// - By default, absence of leverage
	var l = zeros;
	if (lowerBounds) {
		l = new Matrix_(lowerBounds);
	}
	var u = ones;
	if (upperBounds) {
		u = new Matrix_(upperBounds);
	}
	
		// Solve the quadratic program
	var sol = qpsolveGSMO_(Q, p, b, r, l, u, {eps: eps, maxIter: maxIterations});
	
	
	// ----
	
	// Extract the computed portfolio weights.
	var weights = sol[0];

	// Return the computed weights
	return weights.toArray();
}


/**
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 


/**
* @function inverseVolatilityWeights
*
* @summary Compute the weights of the inverse volatility portfolio.
*
* @description This function returns the weights w_1,...,w_n associated to the fully invested and long-only portfolio
* of n assets weighted by their inverse volatility, defined as w_i = 1/sigma_i / (sum(1/sigma_j), j=1..n), i=1..n, with sigma_i the standard deviation 
* of the asset i.
*
* This portfolio is unique.
*
* This portfolio maximizes the Sharpe ratio if the assets mean returns are proportional to their volatilities and all pair-wise correlations are equal.
* 
* @see <a href="https://doi.org/10.3905/jpm.2012.38.3.056">Carvalho, Raul Leote de and Xiao, Lu and Moulin, Pierre, Demystifying Equity Risk-Based Strategies: A Simple Alpha Plus Beta Description (September 13, 2011). The Journal of Portfolio Management, vol. 38, no. 3, Spring 2012.</a>
* @see <a href="https://doi.org/10.1007/s10479-017-2474-7">Ardia, D., Bolliger, G., Boudt, K. et al. The impact of covariance misspecification in risk-based portfolios. Ann Oper Res 254, 1–16 (2017).</a>
* 
* @param {Matrix_|<Array.<number>} sigma the variance vector (sigma_i),i=1..n of the n assets in the considered universe, an n by 1 matrix (i.e., vector) or an array of n real numbers satisfying sigma[i-1] = sigma_i.
* @param {object} opt optional parameters for the algorithm, unused.
* @return {Array.<number>} the weights corresponding to computed portfolio, array of n real numbers.
*
* @example
* inverseVolatilityWeights([0.1, 0.2]);
* // ~[0.59, 0.41]
*/
self.inverseVolatilityWeights = function (sigma, opt) {
	// TODO: Checks, if enabled
	// Check that the values of sigma are strictly positive
	
	// ------
	
	// The output weights are defined as the normalized inverses of the assets standard deviations.
	var weights = new Matrix_(sigma).elemMap(function(i,j,val) { return 1/Math.sqrt(val); })
	weights = weights.normalize(weights);
	
	// Return the computed weights
	return weights.toArray();
}


/**
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 



/**
* @function maximumSharpeRatioWeights
*
* @summary Compute the weights of the portfolio maximizing the Sharpe ratio.
*
* @description This function returns the weights w_1,...,w_n associated to the fully invested and 
* long-only portfolio of n assets maximizing the Sharpe ratio, which is defined as the ratio of the 
* portfolio excess return over a constant risk-free rate to the portfolio volatility.
*
* Optionally, the following constraints can be added:
* - Minimum weight of each asset that is included in the portfolio
* - Maximum weight of each asset that is included in the portfolio
*
* When it exists, this portfolio is mean-variance efficient and is unique.
*
* The main algorithm used internally is the Markowitz critical line algorithm, c.f. the second reference.
*
* @see <a href="https://doi.org/10.1111/j.1540-6261.1976.tb03217.x">Elton, E. J., Gruber, M. J. and Padberg, M. W. (1976), SIMPLE CRITERIA FOR OPTIMAL PORTFOLIO SELECTION. The Journal of Finance, 31: 1341-1357</a>
* @see Harry M. Markowitz, Portfolio Selection, Efficient Diversification of Investments, Second edition, Blackwell Publishers Inc.
* @see <a href="https://www.jstor.org/stable/1924119">Lintner, John. The Valuation of Risk Assets and the Selection of Risky Investments in Stock Portfolios and Capital Budgets. The Review of Economics and Statistics 47, no. 1 (1965): 13-37.</a>
*
* @param {<Array.<number>} mu the returns of the n assets in the considered universe, array of n real numbers.
* @param {Array.<Array.<number>>} sigma the covariance matrix (sigma_ij),i,j=1..n of the n assets in the considered universe, array of n array of n real numbers statisfying sigma[i-1][j-1] = sigma_ij.
* @param {number} rf the risk-free rate, a real number.
* @param {object} opt optional parameters for the algorithm.
* @param {number} opt.maxIter the maximum number of iterations of the critical line algorithm, a strictly positive natural integer; defaults to 1000.
* @param {number} opt.constraints.minWeights an array of size n (l_i),i=1..n containing the minimum weights for the assets to include in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of zeros.
* @param {number} opt.constraints.maxWeights an array of size n (u_i),i=1..n containing the minimum weights for the assets to include in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of ones.
* @return {Array<Array.<number>} the weights corresponding to the portfolio maximizing the Sharpe ratio, array of n real numbers.
*
* @example
* maximumSharpeRatioWeights([0.1, 0.2], [[1, 0.3], [0.3, 1]], 0)
* // [~0.19, ~0.81]
*/
self.maximumSharpeRatioWeights = function(mu, sigma, rf, opt) {
	var eps = 1e-8; // the numerical zero
	
	// Internal function to compute the return of a portfolio
	function portfolioReturn(x, mu, sigma) {
		return Matrix_.vectorDotProduct(mu, x);
	}
	
	// Internal function to compute the volatility of a portfolio
	function portfolioVolatility(x, mu, sigma) {	
		// Compute the variance x'*SIGMA*x
		var sigma_x_x = Matrix_.vectorDotProduct(Matrix_.xy(sigma, x), x);		

		// In case the variance is numerically zero, which can occur with 
		// a semi-positive definite covariance matrix, it is replaced with zero.
		//
		// Otherwise, if the variance is negative, stops the algorithm,
		// since the covariance matrix is then not numerically semi-positive definite.
		if (Math.abs(sigma_x_x) <= eps) {
			sigma_x_x = 0;
		}
		else if (sigma_x_x < 0 && sigma_x_x < -eps) {
			throw new Error('negative volatility, covariance matrix might not be semi-definite positive');
		}
		
		// Compute the volatility SQRT(x'*SIGMA*x)
		var s_x = Math.sqrt(sigma_x_x);
	   
		// Return the computed volatility
		return s_x;
	}

	// Internal function to compute the Sharpe ratio of a portfolio,
	// as well as the intermediate values of return and volatility.
	function computeSharpeRatio_(mu, sigma, rf, weights) {
		// The numerator: <mu/w> - rf
		var ret = portfolioReturn(weights, mu, sigma);
		var excessRet = ret - rf;
		
		// The denominator: Sqrt(<Sigma*w/w>)
		var vol = portfolioVolatility(weights, mu, sigma);
		
		// In case the denominator is numerically null, which can occur with
		// semi-positive definite covariance matrices, replace it with the
		// value of the numerical zero.
		if (Math.abs(vol) < eps) {
			vol = eps;
		}
		
		// Compute the Sharpe ratio
		var sharpeRatio = excessRet/vol;
		
		// Return the computed Sharpe ratio and intermediate values
		return [sharpeRatio, ret, vol];
	}

	// Internal function to compute the corner portfolio which maximizes the
	// Sharpe ratio on the efficient frontier restricted to portfolios with:
	// - A strictly positive volatility
	// - A strictly positive excess return
	//
	// This function uses a binary search algorithm, which is justified because
	// the Sharpe ratio is a strictly unimodular function on the above restricted
	// efficient frontier, c.f. the first reference.
	function computeMaximumSharpeRatioCornerPortfolio_(mu, sigma, rf, cornerPortfolios) {
		// The efficient frontier portfolios are provided from highest return/volatility
		// to lowest return/volatility, so that *_min below refers to properties of the portfolio
		// with the lowest return/volatility.
		var idx_min = cornerPortfolios.length - 1;
		var idx_max = 0;

		var weights_min = cornerPortfolios[idx_min][0];
		var weights_max = cornerPortfolios[idx_max][0];

		var sharpeRatio_min = computeSharpeRatio_(mu, sigma, rf, weights_min);
		var sharpeRatio_max = computeSharpeRatio_(mu, sigma, rf, weights_max);
		
		// In case there is only one corner portfolio on the efficient frontier,
		// exit immediately.
		if (idx_min == idx_max) {
			return [idx_min, weights_min, sharpeRatio_min];
		}
		
		// Otherwise, determine the corner portfolio with the maximum Sharpe ratio 
		// using a binary search algorithm.
		while (idx_min - idx_max != 1) { 
			// Compute properties on the middle points
			var idx_middle = Math.floor(idx_max + (idx_min - idx_max)/2); // formula avoiding numerical overflow
			var weights_middle = cornerPortfolios[idx_middle][0];
			var sharpeRatio_middle = computeSharpeRatio_(mu, sigma, rf, weights_middle);

			var idx_middle_p = idx_middle + 1; 
			var weights_middle_p = cornerPortfolios[idx_middle_p][0];
			var sharpeRatio_middle_p = computeSharpeRatio_(mu, sigma, rf, weights_middle_p);

			// Determine in which sub-interval [idx_max, idx_middle+1] or [idx_middle+1, idx_min]
			// lies the corner portfolio with the maximum Sharpe ratio.
			if (sharpeRatio_middle[0] > sharpeRatio_middle_p[0]) {
				idx_min = idx_middle;
				weights_min = weights_middle;
				sharpeRatio_min = sharpeRatio_middle;
			}
			else if (sharpeRatio_middle[0]	< sharpeRatio_middle_p[0]) {
				idx_max = idx_middle;
				weights_max = weights_middle;
				sharpeRatio_max = sharpeRatio_middle;
			}
			else {
				// In case the Sharpe ratio is equal on both corner portfolios, 
				// it means its maximum is attained somewhere between these two portfolios, 
				// due to its strict unimodality.
				//
				// The binary search procedure can then be prematurely stopped, although
				// this case is (numerically) highly improbable.
				idx_min = idx_middle_p;
				weights_min = weights_middle_p;
				sharpeRatio_min = sharpeRatio_middle_p;
				
				idx_max = idx_middle;
				weights_max = weights_middle;
				sharpeRatio_max = sharpeRatio_middle;

				break;
			}
		}

		
		// Return the computed corner portfolio
		return [idx_min, weights_min, sharpeRatio_min];
	}

	// Internal function to compute the efficient portfolio which maximizes the
	// Sharpe ratio on an efficient segment defined by two adjacent corner portfolios
	// with:
	// - A strictly positive volatility
	// - A strictly positive excess return
	//
	// On such an efficient segment, the weights associated this portfolio are a 
	// convex combination of the weights of the two adjacent corner portfolios,
	// so that w = t*w_min + (1-t)*w_max, t in [0,1], with t to be determined,
	// c.f. the second reference.
	//
	// With E(w) = <mu/w> the portfolio return and V(w) = <Sigma*w/w> the portfolio 
	// variance, the Sharpe ratio is defined as SR(w) = (E(w) - rf)/SQRT(V(w)).
	//
	// Because SR(w) > 0 on the efficient segment, maximizing SR(w) is equivalent
	// to maximizing SR(w)^2, which is equal to (E(w) - rf)^2/V(w).
	//
	// By linearity of E(w) and bilinearity/symmetry of V(w), SR(w)^2 is also equal to
	// a rational fraction in t:
	//
	// (E(w) - rf)^2/V(w)
	// =
	// ( E(t*w_min + (1-t)*w_max) - rf )^2 / ( V(t*w_min + (1-t)*w_max) )
	// =
	// ( t*(E(w_min) - E(w_max)) + E(w_max) - rf )^2 / ( t^2*(V(w_min) + V(w_max) - 2*<Sigma*w_min/w_max>) - 2*t*(V(w_max) - <Sigma*w_min/w_max>) + V(w_max) )
	// = ( t^2*(E(w_min) - E(w_max))^2 + 2*(E(w_min) - E(w_max))*(E(w_max) - rf) + (E(w_max) - rf)^2 ) / ( t^2*(V(w_min) + V(w_max) - 2*<Sigma*w_min/w_max>) - 2*t*(V(w_max) - <Sigma*w_min/w_max>) + V(w_max) )
	//
	// So, maximizing SR(w) on the efficient segment is equivalent to maximizing
	// SR(t)^2, t in [0,1].
	//
	// Since SR(t)^2 is a differentiable function on [0,1] and since [0,1] is a closed convex set,
	// its maximum is either reached on its boundary (i.e., {0,1}) or on a critical interior point
	// (i.e., a point belonging to ]0,1[ on which the derivative of SR(t)^2 vanishes).
	//
	// Evaluating SR(t) on each of these (at most) four points and selecting t
	// as the value which maximizes SR(t) then allows to compute the weights 
	// of the efficient portfolio which maximizes the Sharpe ratio on the efficient segment.
	function computeLocalMaximumSharpeRatioEfficientPortfolio_(mu, sigma, rf, idx_min, weights_min, idx_max, weights_max) {
		// Compute properties of the two adjacent corner portfolios
		var sharpeRatio_min = computeSharpeRatio_(mu, sigma, rf, weights_min);
		var sr_min = sharpeRatio_min[0];
		var return_min = sharpeRatio_min[1];
		var volatility_min = sharpeRatio_min[2];
		var variance_min = volatility_min * volatility_min;
		
		var sharpeRatio_max = computeSharpeRatio_(mu, sigma, rf, weights_max);
		var sr_max = sharpeRatio_max[0];
		var return_max = sharpeRatio_max[1];
		var volatility_max = sharpeRatio_max[2];
		var variance_max = volatility_max * volatility_max;
		
		// Define the coefficients of the fractional function SR(t)^2 = ( at^2 + bt + c ) / ( dt^2 + et + f )
		var return_min_m_max = return_min - return_max;
		var return_max_m_rf = return_max - rf;
		var a = return_min_m_max * return_min_m_max;
		var b = 2 * return_min_m_max * return_max_m_rf;
		var c = return_max_m_rf * return_max_m_rf;
		
		var variance_cross = Matrix_.vectorDotProduct(Matrix_.xy(sigma, weights_min), weights_max); // <Sigma*w_min/w_max>
		var d = variance_min + variance_max - 2 * variance_cross; // always >= 0, by semi-definite positivity of the covariance matrix
		var e = -2 * (variance_max - variance_cross); // 
		var f = variance_max; //always > 0
		
		// Define the coefficients of the second order polynomial aat^2 + bbt + cc equal to the
		// numerator of the derivative d(SR(t)^2)/dt.
		var aa = a*e - b*d;
		var bb = 2*(a*f - c*d);
		var cc = b*f - c*e;
		
		// Extract the roots t1 and t2 of the equation d(SR(t)^2)/dt = 0, using a stable numerical formula.
		var bb_p = bb/2; // reduced discriminant
		var sign_bb_p = (bb_p >= 0) ? 1 : -1; // Math.sign is not supported everywhere plus it is mandatory that for bb_p == 0 this returns 1
		var disc = bb_p*bb_p - aa*cc;
		if (disc < 0) {
			throw new Error('internal error, the covariance matrix might not be semi-definite positive');
		}
		var qq = -(bb_p + sign_bb_p * Math.sqrt(disc));
		var t1 = qq/aa;
		var t2 = cc/qq;
		
		// Compute and order the Sharpe ratios for all the efficient 
		// portfolios with t corresponding to {0, 1, t1, t2}.
		var candidateSharpeRatios = [[weights_min, sr_min], [weights_max, sr_max]]; // t = 0 and t = 1 portfolios are always present
		
		if (t1 > 0 && t1 < 1) { // t1 belongs to ]0,1[
			var weights_t1 = Matrix_.fill(weights_min.nbRows, 1, 
										function(i,j) { 
											return t1*weights_min.getValue(i, 1) + (1-t1)*weights_max.getValue(i, 1); 
										})
			var sharpeRatio_t1 = computeSharpeRatio_(mu, sigma, rf, weights_t1);
			var sr_t1 = sharpeRatio_t1[0];
			
			candidateSharpeRatios.push([weights_t1, sr_t1]);
		}

		if (t2 > 0 && t2 < 1) { // t2 belongs to ]0,1[
			var weights_t2 = Matrix_.fill(weights_min.nbRows, 1, 
										function(i,j) { 
											return t2*weights_min.getValue(i, 1) + (1-t2)*weights_max.getValue(i, 1); 
										})
			var sharpeRatio_t2 = computeSharpeRatio_(mu, sigma, rf, weights_t2);
			var sr_t2 = sharpeRatio_t2[0];

			candidateSharpeRatios.push([weights_t2, sr_t2]);
		}

		// Return the efficient portfolio which maximizes the Sharpe ratio
		// on the efficient segment.
		var compareSharpeRatios = function (a, b) {
			return a[1] - b[1];
		};
		return max_(candidateSharpeRatios, compareSharpeRatios)[0];
	}
	
	
	// ------	

	// Convert mu and sigma to matrix format
	var mu = new Matrix_(mu);
	var sigma = new Matrix_(sigma);
	
	
	// ------

	
	// Compute the corner portfolios defining the efficient frontier
	var cornerPortfolios = computeCornerPortfolios_(mu, sigma, opt);
	
	
	// Restrict the efficient frontier to the domain of definition
	// of the Sharpe ratio by determining the "first" efficient portfolio 
	// with a strictly positive volatility.
	//
	// To be noted that:
	// - In case the covariance matrix is positive definite, this is the minimum 
	// variance portfolio, so that the efficient frontier is not altered
	//
	// - In case the covariance matrix is semi-positive definite, this is an efficient
	// portfolio located "close" to the minimum variance portfolio, because the 
	// variance of corner portfolios is strictly increasing	
	var idx = cornerPortfolios.length - 1;
	var weights = cornerPortfolios[idx][0];
	var volatility = portfolioVolatility(weights, mu, sigma);
	if (volatility < eps) {
		// The domain of definition of the Sharpe ratio is not the
		// whole efficient frontier, so that the efficient frontier
		// needs to be restricted.
		
		// Compute the first efficient portfolio with a strictly positive 
		// volatility.
		var efficientPortfolio = computeMeanVarianceEfficientPortfolio_(mu, sigma, cornerPortfolios, 
		                                                               {constraint: "volatility",
															            constraintValue: eps});		
		if (efficientPortfolio.length == 0) {
			throw new Error('no corner portfolio with a strictly positive volatility: the covariance matrix might not be semi-definite positive');
		}
		var efficientPortfolioWeights = efficientPortfolio[0];
		var cornerPortfolioIndexMin = efficientPortfolio[1];
			
		// Add it as a replacement of the last corner
		// portfolio with a volatility lower than or equal to it.
		//
		// A risk aversion parameter of -1 is set so that subsequent processes 
		// can distinguish between an original corner portfolio and a 
		// replacement corner portfolio.
		cornerPortfolios[cornerPortfolioIndexMin] = [efficientPortfolioWeights, -1];
		
		// Remove the corner portfolios with a volatility strictly lower than
		// the it.
		cornerPortfolios.length = cornerPortfolioIndexMin + 1;
	}

	
	// Further restrict the efficient frontier to the domain of strict positivity
	// of the Sharpe ratio.
	//
	// To be noted that the domain of strict positivity of the Sharpe ratio
	// can be empty in case there is no feasible portfolio on the efficient
	// frontier with a strictly positive excess return.
	var idx = cornerPortfolios.length - 1;
	var weights = cornerPortfolios[idx][0];
	var ret = portfolioReturn(weights, mu, sigma);
	if (ret < rf + eps) {
		// The domain of strict positivity of the Sharpe ratio is not the
		// whole efficient frontier, so that the efficient frontier
		// needs to be restricted.
		
		// Compute the first efficient portfolio with a strictly positive 
		// excess return.
		var efficientPortfolio = computeMeanVarianceEfficientPortfolio_(mu, sigma, cornerPortfolios, 
		                                                                {constraint: "return",
															             constraintValue: rf + eps});
		if (efficientPortfolio.length == 0) {
			throw new Error('no corner portfolio with a strictly positive excess return');
		}
		var efficientPortfolioWeights = efficientPortfolio[0];
		var cornerPortfolioIndexMin = efficientPortfolio[1];
		
		// Add it as a replacement of the last corner
		// portfolio with an excess return lower than or equal to it.
		//
		// A risk aversion parameter of -1 is set so that subsequent processes 
		// can distinguish between an original corner portfolio and a 
		// replacement corner portfolio.
		cornerPortfolios[cornerPortfolioIndexMin] = [efficientPortfolioWeights, -1];
		
		// Remove the corner portfolios with an excess return strictly lower than it.
		cornerPortfolios.length = cornerPortfolioIndexMin + 1;
	}


	// On the restricted efficient frontier, the Sharpe ratio is a pseudo-concave 
	// function, c.f. the first reference, so that it is strictly unimodal.
	//
	// This property allows to search for the corner portfolio with the maximum
	// Sharpe ratio using a binary search algorithm.
	var cornerPortfolio = computeMaximumSharpeRatioCornerPortfolio_(mu, sigma, rf, cornerPortfolios);
	var idx_middle = cornerPortfolio[0];
	var weights_middle = cornerPortfolio[1];
	var sr_middle = cornerPortfolio[2][0];
	

	// The corner portfolio with the maximum Sharpe ratio is adjacent to at most
	// two other corner portfolios, depending on its position on the efficient
	// frontier:
	// - Unique portfolio => zero adjacent corner portfolio
	// - Non unique leftmost or rightmost corner portfolio => one adjacent corner portfolio
	// - Non unique any other corner portfolio => two adjacent corner portfolios
	//
	// In the first case, the efficient portfolio with the maximum Sharpe ratio
	// is the same as the corner portfolio with the maximum Sharpe ratio
	//
	// In the last two cases, because of the strict unimodality of the Sharpe ratio
	// on the restricted efficient frontier, the efficient portfolio with the maximum
	// Sharpe ratio is guaranteed to belong to the efficient segment(s) connecting
	// the corner portfolio with the maximum Sharpe ratio to its adjacent corner
	// portfolio(s).
	//
	// So, computing the efficient portfolio with the maximum Sharpe ratio is equivalent
	// to computing the efficient portfolio with the maximum Sharpe ratio on the efficient
	// segment(s) connecting the corner portfolio with the maximum Sharpe ratio
	// to its adjacent corner portfolio(s).
	
	// Add the corner portfolio with the maximum Sharpe ratio as a candidate 
	// for being the efficient portfolio with the maximum Sharpe ratio.
	var candidateSharpeRatios = [[weights_middle, sr_middle]];
	
	// Compute the efficient portfolio maximizing the Sharpe ratio
	// on the efficient segment [idx_middle+1, idx_middle], if existing.
	var idx_min = idx_middle + 1;
	if (idx_min <= cornerPortfolios.length - 1) {
		var weights_min = cornerPortfolios[idx_min][0];
		
		var weights_min_middle = computeLocalMaximumSharpeRatioEfficientPortfolio_(mu, sigma, rf, 
		                                                                           idx_min, weights_min, 
																			       idx_middle, weights_middle);
		candidateSharpeRatios.push(weights_min_middle);
	}
	
	// Compute the efficient portfolio maximizing the Sharpe ratio
	// on the efficient segment [idx_middle, idx_middle-1], if existing.	
	var idx_max = idx_middle - 1;
	if (idx_max >= 0) {
		var weights_max = cornerPortfolios[idx_max][0];
		
		var weights_middle_max = computeLocalMaximumSharpeRatioEfficientPortfolio_(mu, sigma, rf, 
		                                                                           idx_middle, weights_middle, 
																			       idx_max, weights_max);
        candidateSharpeRatios.push(weights_middle_max);
	}
	
	// Compute the efficient portfolio maximizing the Sharpe ratio
	// by merging the efficient portfolios locally maximizing
	// the Sharpe ratio on each efficient segment.
	var compareSharpeRatios = function (a, b) {
		return a[1] - b[1];
	};
	var maxSharpeRatio = max_(candidateSharpeRatios, compareSharpeRatios)[0];
	var weights = maxSharpeRatio[0];


	// Return the computed portfolio weights
	return weights.toArray();
}

/**
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 



/**
* @function meanVarianceOptimizationWeights
*
* @summary Compute the weights of an efficient mean-variance portfolio subject to a return
* constraint, to misc. volatility constraints, or to a risk tolerance constraint.
*
* @description This function returns the weights w_1,...,w_n associated to the 
* fully invested long-only mean-variance efficient portfolio of n assets subject to either (exclusive):
* - a return constraint, in which case this portfolio, if it exists,
* has the lowest attainable volatility among all the feasible portfolios satisfying the return constraint
* - a volatility constraint, in which case this portfolio, if it exists,
* has the highest attainable return among all the feasible portfolios satisfying the volatility constraint
* - a risk tolerance constraint, in which case this portfolio, which always exists,
* is associated to a risk tolerance satisfying the risk tolerance constraint (this portfolio is a solution
* to the optimization problem min_w <Vw/w>/2 - rt*<w/e>, s.t. <w/e>=1 and l <= x <= u)
* - a maximum volatility constraint, in which case this portfolio, if it exists,
* has a volatility equal to the maximum feasible volatility lower than or equal to the maximum volatility constraint,
* and has the highest attainable return among all the feasible portfolios with the same volatility

* Optionally, the following constraints can be added:
* - Partial investment constraint, replacing the full investment constraint
* - Minimum weight of each asset that is included in the portfolio
* - Maximum weight of each asset that is included in the portfolio
*
* The main algorithm used internally is the Markowitz critical line algorithm, c.f. the reference.
*
* @see Harry M. Markowitz, Portfolio Selection, Efficient Diversification of Investments, Second edition, Blackwell Publishers Inc.
*
* @param {Array.<number>} mu the returns of the n assets in the considered universe, array of n real numbers.
* @param {Array.<Array.<number>>} sigma the covariance matrix (sigma_ij),i,j=1..n of the n assets in the considered universe, array of n array of n real numbers statisfying sigma[i-1][j-1] = sigma_ij.
* @param {object} opt parameters for the mean-variance optimization algorithm.
* @param {number} opt.maxIter the maximum number of iterations of the critical line algorithm, a strictly positive natural integer; defaults to 1000.
* @param {boolean} opt.constraints.fullInvestment parameter set to false in case the full investment constraint of the portfolio must be replaced
* by a partial investment constraint; defaults to true.
* @param {number} opt.constraints.return, the desired value for the return of the portfolio, a real number.
* @param {number} opt.constraints.volatility, the desired value for the volatility of the portfolio, a positive real number.
* @param {number} opt.constraints.riskTolerance, the desired value for the risk tolerance parameter, a positive real number.
* @param {number} opt.constraints.maxVolatility, the maximum desired value for the volatility of the portfolio, a positive real number.
* @param {Array.<number>} opt.constraints.minWeights an optional array of size n (l_i),i=1..n containing the minimum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of zeros.
* @param {Array.<number>} opt.constraints.maxWeights an optional array of size n (u_i),i=1..n containing the maximum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of ones.
* @return {Array<Array.<number>} the weights corresponding to the mean-variance efficient portfolio, array of n real numbers.
*
* @example
* meanVarianceOptimizationWeights([0.1, 0.2], [[1, 0.3], [0.3, 1]], { constraints: {return: 0.15}})
* // [0.5, 0.5] 
*/
self.meanVarianceOptimizationWeights = function(mu, sigma, opt) {	
	var eps = 1e-8; // the numerical zero
	
	// Internal function to compute the return of a portfolio
	function portfolioReturn(x, mu, sigma) {
		return Matrix_.vectorDotProduct(mu, x);
	}
	
	// Internal function to compute the volatility of a portfolio
	function portfolioVolatility(x, mu, sigma) {	
		// Compute the variance x'*SIGMA*x
		var sigma_x_x = Matrix_.vectorDotProduct(Matrix_.xy(sigma, x), x);		

		// In case the variance is numerically zero, which can occur with 
		// a semi-positive definite covariance matrix, it is replaced with zero.
		//
		// Otherwise, if the variance is negative, stops the algorithm,
		// since the covariance matrix is then not numerically semi-positive definite.
		if (Math.abs(sigma_x_x) <= eps) {
			sigma_x_x = 0;
		}
		else if (sigma_x_x < 0 && sigma_x_x < -eps) {
			throw new Error('negative volatility, covariance matrix might not be semi-definite positive');
		}
		
		// Compute the volatility SQRT(x'*SIGMA*x)
		var s_x = Math.sqrt(sigma_x_x);
	   
		// Return the computed volatility
		return s_x;
	}
	
	
	// ------	

	// Decode options
	if (opt === undefined) {
		opt = { constraints: {} };
	}
	if (opt.constraints === undefined) {
		opt.constraints = {};
	}
	
	// Decode the full investment constraint
	var fullInvestmentContraint = true;
	if (opt.constraints.fullInvestment !== undefined) {
		fullInvestmentContraint = opt.constraints.fullInvestment;
	}
	
	// Decode the mutually exclusive return/volatility constraints
	var returnConstraint = opt.constraints["return"]; // .return does not work within Google Script
	var volatilityConstraint = opt.constraints.volatility;
	var maxVolatilityConstraint = opt.constraints.maxVolatility;
	var riskToleranceConstraint = opt.constraints.riskTolerance;
	if (returnConstraint === undefined && volatilityConstraint === undefined &&
		maxVolatilityConstraint === undefined && riskToleranceConstraint == undefined) {
		throw new Error('missing return, volatility or risk tolerance constraints');
	}
	if ( (returnConstraint !== undefined && volatilityConstraint !== undefined) ||
		 (returnConstraint !== undefined && maxVolatilityConstraint !== undefined) ) {
		throw new Error('simultaneous return and volatility constraints');
	}
	if ( riskToleranceConstraint !== undefined && 
	     (returnConstraint !== undefined || maxVolatilityConstraint !== undefined || volatilityConstraint !== undefined) ) {
		throw new Error('simultaneous risk tolerance and return or volatility constraints');
	}
	
	// Convert mu and sigma to matrix format
	var mu = new Matrix_(mu);
	var sigma = new Matrix_(sigma);
	
	
	// ------
	
	
	// Initializations
	var nbAssets = sigma.nbColumns;
	
	
	// Compute the corner portfolios defining the efficient frontier
	//
	// In case of partial investment constraint, the input assets are altered by
	// the addition of a virtual risk free asset with (0,0,0) return/volatility/covariance.
	//
	// The corner portfolios defining the altered efficient frontier are then computed
	// instead of the corner portfolios defining the initial efficient frontier.
	var cornerPortfolios;
	if (fullInvestmentContraint) {
		cornerPortfolios = computeCornerPortfolios_(mu, sigma, opt);
	}
	else {
		// Extend the returns/covariances of the input assets with a risk free asset,
		// of index (nbAssets + 1).
		mu = Matrix_.fill(nbAssets + 1, 1, 
							function(i, j) { 
								if (i <= nbAssets) {
									return mu.getValue(i, 1);
								}
								else {
									return 0;
								}
							});
		sigma = Matrix_.fill(nbAssets + 1, nbAssets + 1, 
							function(i, j) { 
								if (i <= nbAssets && j <= nbAssets) {
									return sigma.getValue(i, j);
								}
								else {
									return 0;
								}
							});
										
		// In case minimum/maximum weights constraints are provided, extend them.
		var minWeights = null;
		if (opt.constraints.minWeights) {
			minWeights = typeof Float64Array === 'function' ? new Float64Array(nbAssets + 1) : new Array(nbAssets + 1); 
			for (var i = 0; i < nbAssets; ++i) {
				minWeights[i] = opt.constraints.minWeights[i];
			}
			minWeights[nbAssets] = 0; // risk free asset, no min weight
		}
		var maxWeights = null;
		if (opt.constraints.maxWeights) {
			maxWeights = typeof Float64Array === 'function' ? new Float64Array(nbAssets + 1) : new Array(nbAssets + 1); 
			for (var i = 0; i < nbAssets; ++i) {
				maxWeights[i] = opt.constraints.maxWeights[i]
			}
			maxWeights[nbAssets] = 1; // risk free asset, no max weight
		}
			
		// Create and fill a new options structure
		var newOpt = { maxIter: opt.maxIter, constraints: opt.constraints };
		if (opt.constraints.minWeights) {
			newOpt.constraints.minWeights = minWeights;
		}
		if (opt.constraints.maxWeights) {
			newOpt.constraints.maxWeights = maxWeights;
		}
			
		// Compute the corner portfolios corresponding to the new efficient frontier
		// for the altered input assets.
		cornerPortfolios = computeCornerPortfolios_(mu, sigma, newOpt);			
	}
	
	
	// Depending on the constraint, proceed with a different algorithm
	// to compute the requested efficient portfolio.
	var efficientPortfolioWeights;
	if (returnConstraint !== undefined) {
		var efficientPortfolio = computeMeanVarianceEfficientPortfolio_(mu, sigma, cornerPortfolios, {constraint: "return", 
																						              constraintValue: returnConstraint});
		if (efficientPortfolio.length == 0) {
			throw new Error('no matching efficient portfolio with a return equal to ' + returnConstraint);
		}
		else {
			efficientPortfolioWeights = efficientPortfolio[0];
		}
	}
	else if (volatilityConstraint !== undefined) {
		var efficientPortfolio = computeMeanVarianceEfficientPortfolio_(mu, sigma, cornerPortfolios, {constraint: "volatility", 
																						              constraintValue: volatilityConstraint});
		if (efficientPortfolio.length == 0) {
			throw new Error('no matching efficient portfolio with a volatility equal to ' + volatilityConstraint);
		}
		else {
			efficientPortfolioWeights = efficientPortfolio[0];
		}
	}
	else if (riskToleranceConstraint !== undefined) {
		// Compute the portfolio with the highest/lowest risk tolerance on the efficient frontier,
		// which corresponds to the rightmost/leftmost portfolios.
		var highestRiskTolerancePortfolioWeights = cornerPortfolios[0][0];
		var highestRiskTolerance = cornerPortfolios[0][1];
		var lowestRiskTolerancePortfolioWeights = cornerPortfolios[cornerPortfolios.length-1][0];
		var lowestRiskTolerance = cornerPortfolios[cornerPortfolios.length-1][1];

		
		// If the desired risk tolerance is greater than the highest attainable
		// risk tolerance on the efficient frontier, the efficient portfolio is computed
		// as the rightmost portfolio on the efficient frontier, because this portfolio 
		// also corresponds to all risk tolerances greater than or equal to the
		// highest attainable risk tolerance on the efficient frontier.
		//
		// If the desired risk tolerance is lower than the lowest attainable
		// risk tolerance on the efficient frontier, the efficient portfolio is computed
		// as the leftmost portfolio on the efficient frontier, because this is a numerical
		// rounding issue, since the lowest attainable risk tolerance on the efficient frontier must be 
		// equal to 0.
		//
		// Otherwise, the efficient portfolio is computed as the efficient portfolio 
		// with a risk tolerance strictly equal to the desired risk tolerance.
		if (riskToleranceConstraint > highestRiskTolerance - eps) {
			efficientPortfolioWeights = highestRiskTolerancePortfolioWeights;
		}
		else if (riskToleranceConstraint < lowestRiskTolerance + eps) {
			efficientPortfolioWeights = lowestRiskTolerancePortfolioWeights;
		}
		else {
			var efficientPortfolio = computeMeanVarianceEfficientPortfolio_(mu, sigma, cornerPortfolios, {constraint: "riskTolerance", 
																										  constraintValue: riskToleranceConstraint});
			if (efficientPortfolio.length == 0) {
				throw new Error('internal error: no matching efficient portfolio with a risk tolerance equal to ' + riskToleranceConstraint);
			}
			else {
				efficientPortfolioWeights = efficientPortfolio[0];
			}
		}																						  
	}
	else if (maxVolatilityConstraint !== undefined) {
		// Compute the portfolio with the highest volatility on the efficient frontier,
		// which corresponds to the rightmost portfolio.
		var highestVolatilityPortfolioWeights = cornerPortfolios[0][0];
		var highestVolatility = portfolioVolatility(highestVolatilityPortfolioWeights, mu, sigma);

		// If the desired maximum volatility is greater than the highest attainable
		// volatility on the efficient frontier, the efficient portfolio is computed
		// as the rightmost portfolio on the efficient frontier.
		//
		// Otherwise, the efficient portfolio is computed as the efficient portfolio 
		// with a volatility strictly equal to the desired maximum volatility.		
		if (maxVolatilityConstraint > highestVolatility - eps) {
			efficientPortfolioWeights = highestVolatilityPortfolioWeights;
		}
		else {
			var efficientPortfolio = computeMeanVarianceEfficientPortfolio_(mu, sigma, cornerPortfolios, {constraint: "volatility", 
																						                  constraintValue: maxVolatilityConstraint});
			if (efficientPortfolio.length == 0) {
				throw new Error('no matching efficient portfolio with a volatility lower than or equal to ' + maxVolatilityConstraint);
			}
			else {
				efficientPortfolioWeights = efficientPortfolio[0];
			}
		}
	}	

	
	// In case of partial investment constraint, transform the fully invested efficient
	// portfolio with altered input assets into the associated partially invested efficient 
	// portfolio with the input assets.
	if (!fullInvestmentContraint) {
		efficientPortfolioWeights = Matrix_.fill(nbAssets, 1, 
												function(i, j) { 
													if (i <= nbAssets) {
														return efficientPortfolioWeights.getValue(i, 1);
													}
												});
	}

	
	// Return the computed portfolio weights
	return efficientPortfolioWeights.toArray();
}


/**
* @function computeMeanVarianceEfficientPortfolio_
*
* @summary Compute the weights of an efficient mean-variance portfolio subject to an exact return
* constraint, to an exact volatility constraint or to an exact risk tolerance constraint.
*
* @description This function returns the weights w_1,...,w_n associated to the 
* fully invested long-only mean-variance efficient portfolio of n assets subject to either (exclusive):
* - a return constraint, in which case this portfolio, if it exists,
* has the lowest attainable volatility among all the feasible portfolios satisfying the return constraint
* - a volatility constraint, in which case this portfolio, if it exists,
* has the highest attainable return among all the feasible portfolios satisfying the volatility constraint
* - a risk tolerance constraint, in which case this portfolio, which always exists,
* is associated to a risk tolerance satisfying the risk tolerance constraint
*
* The algorithm used internally is based on a bisection search on the mean-variance efficient frontier, c.f. the reference.
*
* @see Harry M. Markowitz, Portfolio Selection, Efficient Diversification of Investments, Second edition, Blackwell Publishers Inc.
* @see Harry M. Markowitz, Mean-Variance Analysis in Portfolio Choice and Capital Markets, Revised issue (2000), McGraw-Hill Professional;
*
* @param {Array.<number>} mu the returns of the n assets in the considered universe, array of n real numbers.
* @param {Array.<Array.<number>>} sigma the covariance matrix (sigma_ij),i,j=1..n of the n assets in the considered universe, array of n array of n real numbers statisfying sigma[i-1][j-1] = sigma_ij.
* @param {Array<Array.<Object>>} cornerPortfolios the list of corner portfolios defining the efficient frontier on which to compute the mean-variance efficient portfolio, as computed
* by the internal computeCornerPortfolios_ function
* @param {object} opt parameters for the algorithm.
* @param {string} opt.constraint, the type of constraint, a string either equal to "return" for a return constraint, to "volatility" for a volatility constraint,
* or to "riskTolerance" for a risk tolerance constraint.
* @param {number} opt.constraintValue, the desired constraint value (i.e., the desired return or volatility), a real number.
*
* @return {Array.<Matrix_, number, number>} the weights corresponding to the mean-variance efficient portfolio, matrix of n real numbers.
*
*/
function computeMeanVarianceEfficientPortfolio_(mu, sigma, cornerPortfolios, opt) {
	var eps = 1e-8; // the numerical zero
	
	// Internal function to compute the return of a corner portfolio
	function portfolioReturn(x, mu, sigma, lambda) {
		return Matrix_.vectorDotProduct(mu, x);
	}
	
	// Internal function to compute the volatility of a corner portfolio
	function portfolioVolatility(x, mu, sigma, lambda) {	
		// Compute the variance x'*SIGMA*x
		var sigma_x_x = Matrix_.vectorDotProduct(Matrix_.xy(sigma, x), x);		

		// In case the variance is numerically zero, which can occur with 
		// a semi-positive definite covariance matrix, it is replaced with zero.
		//
		// Otherwise, if the variance is negative, stops the algorithm,
		// since the covariance matrix is then not numerically semi-positive definite.
		if (Math.abs(sigma_x_x) <= eps) {
			sigma_x_x = 0;
		}
		else if (sigma_x_x < 0 && sigma_x_x < -eps) {
			throw new Error('negative volatility, covariance matrix might not be semi-definite positive');
		}
		
		// Compute the volatility SQRT(x'*SIGMA*x)
		var s_x = Math.sqrt(sigma_x_x);
	   
		// Return the computed volatility
		return s_x;
	}
	
	// Internal function to compute the risk tolerance of a corner portfolio
	function portfolioRiskTolerance(x, mu, sigma, lambda) {
		return lambda;
	}
	
	// Internal function to compute the (at most) two corner portfolios enclosing the
	// efficient portfolio with a target constraint value (return, volatility or risk tolerance),
	// using a binary search algorithm.
	//
	// The usage of a binary search algorithm is justified because the corner portfolios
	// return, volatility and risk tolerance are decreasing as soon as there are at least two corner
	// portfolios on the efficient frontier.
	function computeEnclosingCornerPortfolios(fct, fctValue, cornerPortfolios) {		
		// The efficient frontier portfolios are provided from highest return/volatility/risk tolerance
		// to lowest return/volatility/risk tolerance, so that *_min below refers to properties of the portfolio
		// with the lowest return/volatility/risk tolerance.
		var idx_min = cornerPortfolios.length - 1;
		var idx_max = 0

		var weights_min = cornerPortfolios[idx_min][0];
		var weights_max = cornerPortfolios[idx_max][0];
		
		var lambda_min = cornerPortfolios[idx_min][1];
		var lambda_max = cornerPortfolios[idx_max][1];

		var fct_min = fct(weights_min, mu, sigma, lambda_min);
		var fct_max = fct(weights_max, mu, sigma, lambda_max);

		// If the desired target constraint function value is numerically strictly greater than the highest attainable
		// constraint function value on the efficient frontier, or if the desired target constraint function 
		// value is numerically strictly lower than the lowest attainable constraint function value on the efficient frontier, 
		// there is no enclosing corner portfolio on the efficient frontier.
		if (fctValue > fct_max + eps || fctValue < fct_min - eps) {
			return [];
		}
		
		// Otherwise, if the target constraint function value is numerically reached on one of the
		// two extremal corner portfolios, return immediately.
		if (Math.abs(fctValue - fct_min) <= eps) {
			return [[idx_min, weights_min, fct_min]];
		}
		else if (Math.abs(fctValue - fct_max) <= eps) {
			return [[idx_max, weights_max, fct_max]];
		}
		
		// Otherwise, determine the two adjacent corner portfolios enclosing the portfolio
		// with a constraint function value numerically equals to the target constraint function value, 
		// using a binary search algorithm.
		while (idx_min - idx_max != 1) { 
			// Compute properties on the middle point
			var idx_middle = Math.floor(idx_max + (idx_min - idx_max)/2); // formula avoiding numerical overflow
			var weights_middle = cornerPortfolios[idx_middle][0];
			var lambda_middle = cornerPortfolios[idx_middle][1];
			var fct_middle = fct(weights_middle, mu, sigma, lambda_middle);
			
			// Determine in which sub-interval ]idx_max, idx_middle[ or ]idx_middle, idx_min[
			// lies the portfolio with the target constraint function value.
			if (fct_middle > fctValue) {
				idx_max = idx_middle;
				fct_max = fct_middle;
				weights_max = weights_middle;
			}
			else if (fct_middle < fctValue) {
				idx_min = idx_middle;
				fct_min = fct_middle;
				weights_min = weights_middle;
			}
			else { // the target constraint function value is exactly attained on the idx_middle-th corner portfolio
				return [[idx_middle, weights_middle, fct_middle]];
			}
		}

		
		// Return the computed adjacent corner portfolios, as well as
		// the associated function values.
		return [[idx_min, weights_min, fct_min], [idx_max, weights_max, fct_max]];
	}
	
	
	// ------	

	
	// Decode the input constraints
	var constraint = opt.constraint;
	if (constraint === undefined || constraint === null) {
		throw new Error('internal error: missing constraint');
	}
	
	var constraintFct;
	if (constraint == "return") {
		constraintFct = portfolioReturn;
	}
	else if (constraint == "volatility") {
		constraintFct = portfolioVolatility;
	}
	else if (constraint == "riskTolerance") {
		constraintFct = portfolioRiskTolerance;
	}
	else {
		throw new Error('internal error: unknown constraint');
	}
	
	var constraintValue = opt.constraintValue;
	if (constraintValue === undefined || constraintValue === null) {
		throw new Error('internal error: missing constraint value');
	}
	
	
	// Safety checks on the corner portfolios
	if (cornerPortfolios.length === 0) {
		throw new Error('internal error: no corner portfolios');
	}

	
	// Compute the (at most) two corner portfolios enclosing the efficient 
	// portfolio with a constraint function value equals to the target constraint function value.
	var enclosingCornerPortfolios = computeEnclosingCornerPortfolios(constraintFct, 
	                                                                 constraintValue, 
																	 cornerPortfolios);

	
	// Then:
	// - In case the target constraint function value is not reachable, return an empty portfolio 
	//
	// - In case there is a unique computed corner portfolio with a constraint function value
	// equals to the target constraint function value, return the associated portfolio weights
	//
	// - In case there are two corner portfolios enclosing the efficient portfolio with 
	// a constraint function value equals to the target constraint function value, the weights associated 
	// to this efficient portfolio are a convex combination of the weights of the two computed enclosing
	// corner portfolios (c.f. the reference): w = t*w_min + (1-t)*w_max, t in [0,1], with t now to be determined.
	if (enclosingCornerPortfolios.length == 0) {
		return [];
	}
	else if (enclosingCornerPortfolios.length == 1) {
		var idx_min = enclosingCornerPortfolios[0][0];
		var weights = enclosingCornerPortfolios[0][1];
		
		// Return the computed portfolio weights
		return [weights, idx_min];
	}
	else {
		// Extract information about the computed efficient corner portfolios
		var idx_min = enclosingCornerPortfolios[0][0];
		var weights_min = enclosingCornerPortfolios[0][1];
		var fct_min = enclosingCornerPortfolios[0][2];
			
		var idx_max = enclosingCornerPortfolios[1][0];
		var weights_max = enclosingCornerPortfolios[1][1];
		var fct_max = enclosingCornerPortfolios[1][2];
		
		// Compute t above
		var t;
		
		// If the constraint function value to compute is "return", then, the procedure to 
		// compute t above is the following:
		//
		// E(w) = <mu/w> and by linearity of E, we have
		// E(w) = t*E(w_min) + (1-t)*E(w_max) and E(w) = constraintValue
		// <=>
		// t = (E(w_max) - constraintValue)/(E(w_max) - E(w_min))
		//
		//
		// If the constraint function value to compute is "volatility", then, the procedure to 
		// compute t above is the following:
		//
		// Let the volatility be V(w) = <Sigma*w/w>.
		// Then, by symmetry and bi-linearity of V, V(w) = t^2*V(w_min) + (1-t)^2*V(w_max) + 2*t*(1-t)*<Sigma*w_min/w_max>
		// and V(w) = constraintValue^2
		// <=> t is the solution belonging to ]0,1[ of the second order polynomial equation
		// t^2*(V(w_min) + V(w_max) - 2*<Sigma*w_min/w_max>) -2*t*(V(w_max) - <Sigma*w_min/w_max>) + V(w_max) - constraintValue^2 = 0
		//
		//
		// If the constraint function value to compute is "riskTolerance", then, the procedure to 
		// compute t above is the following:
		//
		// On the efficient segment [w_min, w_max], it exist vectors alpha and beta such that
		// w_min = alpha + lambda_min * beta
		// w_max = alpha + lambda_max * beta
		// w     = alpha + constraintValue * beta
		// c.f. for instance formula 7.10a of the second reference.
		// From the two first equations, it is possible to deduce alpha = w_min - lambda_a * (w_max - w_min)/(lambda_max - lambda_min)
		// and beta = (w_max - w_min)/(lambda_max - lambda_min), so that w = ...
		// <=>
		// t = (lambda_max - constraintValue)/(lambda_max - lambda_min)
		//
		if (constraint === "return") {
			t = (fct_max - constraintValue)/(fct_max - fct_min);
		}		
		else if (constraint === "volatility") {		
			// Define the coefficients of the second order polynomial at^2 + bt + c
			var variance_cross = Matrix_.vectorDotProduct(Matrix_.xy(sigma, weights_min), weights_max); // <Sigma*w_min/w_max>
			var a = fct_min * fct_min + fct_max * fct_max - 2 * variance_cross; // always >= 0, by semi-definite positivity of the covariance matrix
			var b = -2 * (fct_max * fct_max - variance_cross); // 
			var c = fct_max * fct_max - constraintValue*constraintValue; //always > 0
			
			// Extract the root t of the equation at^2 + bt + c = 0 belonging to ]0,1[, using a stable numerical formula
			var b_p = b/2; // reduced discriminant
			var sign_b_p = (b_p >= 0) ? 1 : -1; // Math.sign is not supported everywhere plus it is mandatory that for b_p == 0 this returns 1
			var disc = b_p*b_p - a*c;
			if (disc < 0) {
				throw new Error('internal error; the covariance matrix might not be semi-definite positive');
			}
			var q = -(b_p + sign_b_p * Math.sqrt(disc));
			var r1 = q/a;
			var r2 = c/q;
			
			if (r1 > 0 && r1 < 1) {
				t = r1;
			}
			else if (r2 > 0 && r2 < 1) {
				t = r2;
			}
			else {
				throw new Error('internal error: the covariance matrix might not be semi-definite positive');
			}
		}
		else if (constraint === "riskTolerance") {
			t = (fct_max - constraintValue)/(fct_max - fct_min);
		}
		else {
			throw new Error('internal error: unknown constraint');
		}

		// Compute the final efficient portfolio weights
		var weights = Matrix_.fill(weights_min.nbRows, 1, 
							   	   function(i,j) { 
									   return t*weights_min.getValue(i, 1) + (1-t)*weights_max.getValue(i, 1); 
								   });
		
		// Return the computed portfolio weights
		return [weights, idx_min, idx_max];
	}
}


/**
* @function meanVarianceEfficientFrontierNearestWeights
*
* @summary Compute the weights of the nearest portfolio located on the mean variance
* efficient frontier.
*
* @description This function returns the weights w_1,...,w_n, associated to the portfolio located on the
* efficient frontier nearest to the input portfolio in a l^2 norm sense.
*
* The algorithm used internally to compute the efficient frontier is the Markowitz critical line algorithm, c.f. the reference.
*
* @see Harry M. Markowitz, Mean-Variance Analysis in Portfolio Choice and Capital Markets, Revised issue (2000), McGraw-Hill Professional;
*
* @param {Array.<number>} inputWeights the weights w_1,...,w_n associated to a fully invested and long-only portfolio of n assets, array of n real numbers.
* @param {<Array.<number>} mu the returns of the n assets in the considered universe, array of n real numbers.
* @param {Array.<Array.<number>>} sigma the covariance matrix (sigma_ij),i,j=1..n of the n assets in the considered universe, array of n array of n real numbers statisfying sigma[i-1][j-1] = sigma_ij.
* @param {object} opt optional parameters for the algorithm.
* @param {number} opt.maxIter the maximum number of iterations of the critical line algorithm, a strictly positive natural integer; defaults to 1000.
* @param {number} opt.constraints.minWeights an array of size n (l_i),i=1..n containing the minimum weights for the assets to include in the portfolios with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of zeros.
* @param {number} opt.constraints.maxWeights an array of size n (u_i),i=1..n containing the minimum weights for the assets to include in the portfolios with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of ones.
*
* @return {Array<Array.<number>} the weights corresponding to the mean-variance efficient portfolio, array of n real numbers.
*
* @example
* meanVarianceEfficientFrontierNearestWeights()
* // TODO
*/
self.meanVarianceEfficientFrontierNearestWeights = function(inputWeights, mu, sigma, opt) {
	var eps = 1e-8; // the numerical zero
	
	// ------	

	// Convert mu and sigma to matrix format
	var mu = new Matrix_(mu);
	var sigma = new Matrix_(sigma);
	
	// Convert the input weights to matrix format
	var inputWeights = new Matrix_(inputWeights);
	
	// ------

	
	// Compute the corner portfolios defining the efficient frontier
	var cornerPortfolios = computeCornerPortfolios_(mu, sigma, opt);
	if (cornerPortfolios.length == 0) {
		throw new Error('internal error: no corner portfolios');
	}
	
	
	// Compute the projection, in a l^2 norm sense, of the input portfolio on each of
	// the efficient segments making up the efficient frontier.
	//
	// The projection of the input portfolio on the efficient frontier, in a l^2 norm sense, 
	// is then by definition the projected portfolio having the minimum distance with 
	// the input portfolio.
	var weights;
	var minDist = Number.POSITIVE_INFINITY;
	for (var i = 0; i < cornerPortfolios.length - 1; ++i) {
		// Extract the end points of the current efficient segment
		var w_e = cornerPortfolios[i][0];
		var w_b = cornerPortfolios[i+1][0];
		
		// Project the input portfolio on the current efficient segment
		var proj = lineSegmentEuclidianProjection_(inputWeights, w_b, w_e);
		
		// Compute the l^2 distance between the input portfolio and the projected portfolio
		var dist = Matrix_.xmy(inputWeights, new Matrix_(proj)).vectorNorm('two');
		
		// Check if the projected portfolio is a candidate to be the projection of the
		// input portfolio on the whole efficient frontier.
		if (dist <= minDist) {
			weights = proj;
			minDist = dist;
		}
	}
	
	// Return the computed weights
	return weights;
}



/**
* @function meanVarianceEfficientFrontierPortfolios
*
* @summary Compute the weights, returns and volatilities of portfolios belonging 
* to the mean-variance efficient frontier.
*
* @description This function returns the weights w_i1,...,w_in, the returns r_i and the volatilities
* std_i, with i = 1..nbPortfolios, associated to nbPortfolios fully invested and long-only portfolios 
* of n assets belonging to the mean-variance efficient frontier, ordered from the lowest return/volatility
* portfolio to the highest return/volatility portfolio.
*
* Optionally, the following constraints can be added:
* - Minimum weight of each asset that is included in the portfolio
* - Maximum weight of each asset that is included in the portfolio
*
* The main algorithm used internally is the Markowitz critical line algorithm, c.f. the reference.
*
* The algorithm used internally generates the portfolios uniformly on the efficient frontier,
* with regard to the risk tolerance value.
*
* @see Harry M. Markowitz, Mean-Variance Analysis in Portfolio Choice and Capital Markets, Revised issue (2000), McGraw-Hill Professional;
*
* @param {<Array.<number>} mu the returns of the n assets in the considered universe, array of n real numbers.
* @param {Array.<Array.<number>>} sigma the covariance matrix (sigma_ij),i,j=1..n of the n assets in the considered universe, array of n array of n real numbers statisfying sigma[i-1][j-1] = sigma_ij.
* @param {object} opt optional parameters for the algorithm.
* @param {number} opt.nbPortfolios the number of efficient portfolios to compute, a strictly positive natural integer; defaults to 100.
* @param {number} opt.maxIter the maximum number of iterations of the critical line algorithm, a strictly positive natural integer; defaults to 1000.
* @param {number} opt.constraints.minWeights an array of size n (l_i),i=1..n containing the minimum weights for the assets to include in the portfolios with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of zeros.
* @param {number} opt.constraints.maxWeights an array of size n (u_i),i=1..n containing the minimum weights for the assets to include in the portfolios with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of ones.
* @return {Array.<Array.<Object>>} the weights, returns and volatilities of the computed efficient portfolios, an array of nbPortfolios arrays of three elements:
* - arr[0..nbPortfolios-1][0], the weights corresponding to an efficient portfolio, an array of n real numbers
* - arr[0..nbPortfolios-1][1], the return of the efficient portfolio, a real number
* - arr[0..nbPortfolios-1][2], the volatility of the efficient portfolio, a real number
*
* @example
* meanVarianceEfficientFrontierPortfolios([0.1, 0.2], [[1, 0.3], [0.3, 1]], {nbPortfolios: 5})
* // [[[0.5, 0.5], ~0.15, ~0.806], [[0.375, 0.625], 0.1625, ~0.820], [[0.25, 0.75], ~0.175, ~0.859], [[0.125, 0.875], ~0.1875, ~0.920], [[0, 1], 0.2, 1]]
*/
self.meanVarianceEfficientFrontierPortfolios = function(mu, sigma, opt) {
	var eps = 1e-8; // the numerical zero
	
	// Internal function to compute the return of a portfolio
	function portfolioReturn(x, mu, sigma) {
		return Matrix_.vectorDotProduct(mu, x);
	}
	
	// Internal function to compute the volatility of a portfolio
	function portfolioVolatility(x, mu, sigma) {	
		// Compute the variance x'*SIGMA*x
		var sigma_x_x = Matrix_.vectorDotProduct(Matrix_.xy(sigma, x), x);		

		// In case the variance is numerically zero, which can occur with 
		// a semi-positive definite covariance matrix, it is replaced with zero.
		//
		// Otherwise, if the variance is negative, stops the algorithm,
		// since the covariance matrix is then not numerically semi-positive definite.
		if (Math.abs(sigma_x_x) <= eps) {
			sigma_x_x = 0;
		}
		else if (sigma_x_x < 0 && sigma_x_x < -eps) {
			throw new Error('negative volatility, covariance matrix might not be semi-definite positive');
		}
		
		// Compute the volatility SQRT(x'*SIGMA*x)
		var s_x = Math.sqrt(sigma_x_x);
	   
		// Return the computed volatility
		return s_x;
	}

	
	// ------
	
	
	// Decode options
	if (opt === undefined) {
		opt = { constraints: {} };
	}
	var nbPortfolios = opt.nbPortfolios || 100;

	
	// ------
	
	// Convert mu and sigma to matrix format
	var mu = new Matrix_(mu);
	var sigma = new Matrix_(sigma);

	
	// Compute the corner portfolios defining the efficient frontier,
	// as well the minimum/maximum values of the risk aversion parameter.
	var cornerPortfolios = computeCornerPortfolios_(mu, sigma, opt);
	
	
	// Initializations
	var nbAssets = sigma.nbColumns;
	var efficientFrontier = new Array(nbPortfolios);
	
	
	// Limit cases: 
	// - If there is only one corner portfolio on the efficient frontier,
	// return it directly.
	//
	// - Otherwise, the number of portfolios to compute must be greater than two
	// for the algorithm below to be valid
	if (cornerPortfolios.length == 0) {
		throw new Error('efficient frontier made of no corner portfolios: internal error');
	}
	else if (cornerPortfolios.length == 1) {
		if (nbPortfolios != 1) {
			throw new Error('efficient frontier made of only one corner portfolio: only one efficient portfolio can be computed');
		}
		else {
			var weights = cornerPortfolios[0][0];
			var ret = portfolioReturn(weights, mu, sigma);
			var vol = portfolioVolatility(weights, mu, sigma);
			
			return [[weights.toArray(), ret, vol]];
		}
	}
	else { // cornerPortfolios.length >= 2
		if (nbPortfolios <= 1) {
			throw new Error('efficient frontier made of several corner portfolios: at least two efficient portfolios must be computed');
		}
	}
	
	
	// Generate nbPortfolios regularly spaced distinct points lambda_i, i=0..nbPortfolios-1, 
	// belonging to the interval [lambda_min, lambda_max], using the formula
	// lambda_i = lambda_min + i * (lambda_max - 1)/(nbPortfolios - 1).
	//
	// Then, for each of these points, compute the efficient portfolio with a target 
	// risk tolerance parameter equal to lambda_i.

	// Initializations
	var lambda_min = cornerPortfolios[0][1];
	var lambda_max = cornerPortfolios[cornerPortfolios.length-1][1];
	var delta_lambda = (lambda_max - lambda_min)/(nbPortfolios - 1);
	
	for (var i = 0; i < nbPortfolios; ++i) {
		// Generate the current point t_i
		var lambda_i = lambda_min + i * delta_lambda;
		
		// Compute the efficient portfolio with a risk tolerance equal to lambda_i
		var weights = computeMeanVarianceEfficientPortfolio_(mu, sigma, cornerPortfolios, {constraint: "riskTolerance", 
																						   constraintValue: lambda_i});																						   
		if (weights.length == 0) {
			throw new Error('internal error: no matching efficient portfolio with a risk tolerance equal to ' + lambda_i);
		}
		else {
			weights = weights[0];
			
			var ret = portfolioReturn(weights, mu, sigma);
			var vol = portfolioVolatility(weights, mu, sigma);
			
			// Save the computed values, with the highest return/volatility portfolios 
			// provided last and the lowest return/volatility portfolios to be provided first.
			efficientFrontier[(nbPortfolios - 1) - i] = [weights.toArray(), ret, vol];
		}
	}
	
	
	// Return the computed list of portfolios weights, returns and volatilities
	return efficientFrontier;
}



/**
* @function meanVarianceEfficientFrontierCornerPortfolios
*
* @summary Compute the weights, returns and volatilities of the corner portfolios defining
* the mean-variance efficient frontier.
*
* @description This function returns the weights w_i1,...,w_in, the returns r_i and the volatilities
* std_i, with i = 1..m, associated to the m fully invested and long-only corner portfolios 
* of n assets defining the mean-variance efficient frontier, ordered from the lowest return/volatility
* portfolio to the highest return/volatility portfolio.
*
* Optionally, the following constraints can be added:
* - Minimum weight of each asset that is included in the portfolio
* - Maximum weight of each asset that is included in the portfolio
*
* The algorithm used internally is the Markowitz critical line algorithm, c.f. the reference.
*
* @see Harry M. Markowitz, Mean-Variance Analysis in Portfolio Choice and Capital Markets, Revised issue (2000), McGraw-Hill Professional;
*
* @param {<Array.<number>} mu the returns of the n assets in the considered universe, array of n real numbers.
* @param {Array.<Array.<number>>} sigma the covariance matrix (sigma_ij),i,j=1..n of the n assets in the considered universe, array of n array of n real numbers statisfying sigma[i-1][j-1] = sigma_ij.
* @param {object} opt optional parameters for the algorithm.
* @param {number} opt.maxIter the maximum number of iterations of the critical line algorithm, a strictly positive natural integer; defaults to 1000.
* @param {number} opt.constraints.minWeights an array of size n (l_i),i=1..n containing the minimum weights for the assets to include in the portfolios with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of zeros.
* @param {number} opt.constraints.maxWeights an array of size n (u_i),i=1..n containing the minimum weights for the assets to include in the portfolios with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of ones.
* @return {Array.<Array.<Object>>} the weights, returns and volatilities of the m corner portfolios, an array of m arrays of three elements:
* - arr[0..m-1][0], the weights corresponding to a corner portfolio, an array of n real numbers
* - arr[0..m-1][1], the return of the corner portfolio, a real number
* - arr[0..m-1][2], the volatility of the corner portfolio, a real number
*
* @example
* meanVarianceEfficientFrontierCornerPortfolios([0.1, 0.2], [[1, 0.3], [0.3, 1]])
* // [[[0.5, 0.5], ~0.15, ~0.806], [[0, 1], 0.2, 1]]
*/
self.meanVarianceEfficientFrontierCornerPortfolios = function(mu, sigma, opt) {
	//
	var eps = 1e-8; // the numerical zero
	
	// Internal function to compute the return of a portfolio
	function portfolioReturn(x, mu, sigma) {
		return Matrix_.vectorDotProduct(mu, x);
	}
	
	// Internal function to compute the volatility of a portfolio
	function portfolioVolatility(x, mu, sigma) {	
		// Compute the variance x'*SIGMA*x
		var sigma_x_x = Matrix_.vectorDotProduct(Matrix_.xy(sigma, x), x);		

		// In case the variance is numerically zero, which can occur with 
		// a semi-positive definite covariance matrix, it is replaced with zero.
		//
		// Otherwise, if the variance is negative, stops the algorithm,
		// since the covariance matrix is then not numerically semi-positive definite.
		if (Math.abs(sigma_x_x) <= eps) {
			sigma_x_x = 0;
		}
		else if (sigma_x_x < 0 && sigma_x_x < -eps) {
			throw new Error('negative volatility, covariance matrix might not be semi-definite positive');
		}
		
		// Compute the volatility SQRT(x'*SIGMA*x)
		var s_x = Math.sqrt(sigma_x_x);
	   
		// Return the computed volatility
		return s_x;
	}

	// Convert mu and sigma to matrix format
	var mu = new Matrix_(mu);
	var sigma = new Matrix_(sigma);

	// Compute the corner portfolios defining the efficient frontier
	var cornerPortfolios = computeCornerPortfolios_(mu, sigma, opt);
	
	// Convert the output of the internal function above to a list of 
	// portfolios weights, returns and volatilities.
	//
	// Filter the portfolio weights for numerically identical portfolios.

	// Initializations
	var efficientFrontier = [];
	
	// First, the E-maximizing portfolio is always included on the efficient frontier
	var weights = cornerPortfolios[0][0];
	var ret = portfolioReturn(weights, mu, sigma);
	var vol = portfolioVolatility(weights, mu, sigma);
	efficientFrontier.push([weights.toArray(), ret, vol]);
			
	// Then, for each computed corner portfolio:
	// - If it is numerically identical to the last corner portfolio included in the
	// output efficient frontier, do nothing
	//
	// - Otherwise, add it
	var currentWeights = weights;
	for (var i = 1; i < cornerPortfolios.length; ++i) {
		var weights = cornerPortfolios[i][0];
		
		//
		if (Matrix_.areEqual(weights, currentWeights, eps)) {
			continue;
		}
		
		//
		var ret = portfolioReturn(weights, mu, sigma);
		var vol = portfolioVolatility(weights, mu, sigma);
		efficientFrontier.push([weights.toArray(), ret, vol]);
		
		// Prepare for the next iteration
		currentWeights = weights;
	}

	// Return the computed list of portfolios weights, returns and volatilities,
	// sorted from lowest return/volatility to highest return/volatility.
	return efficientFrontier.reverse();
}


/**
* @function computeCornerPortfolios_
*
* @summary Compute all the corner portfolios belonging to the mean-variance efficient frontier.
*
* @description This function returns the weights w_i1,...,w_in as well as the risk aversion parameters lambda_i,
* i = 1..m, associated to the m fully invested and long-only corner portfolios defining the mean-variance
* efficient frontier.
*
* Optionally, the following constraints can be added:
* - Minimum weight of each asset that is included in the portfolio
* - Maximum weight of each asset that is included in the portfolio
*
* The algorithm used internally is the Markowitz critical line algorithm, c.f. the first reference.
*
* @see Harry M. Markowitz, Mean-Variance Analysis in Portfolio Choice and Capital Markets, Revised issue (2000), McGraw-Hill Professional;
* @see <a href="https://doi.org/10.1007/978-0-387-77439-8_12">Niedermayer A., Niedermayer D. (2010) Applying Markowitz’s Critical Line Algorithm. In: Guerard J.B. (eds) Handbook of Portfolio Construction. Springer, Boston, MA</a>
*
* @param {Matrix_} mu the returns of the n assets in the considered universe, a n by 1 matrix.
* @param {Matrix_} sigma the covariance matrix (sigma_ij),i,j=1..n of the n assets in the considered universe, square n by n matrix.
* @param {object} opt optional parameters for the algorithm.
* @param {number} opt.maxIter the maximum number of iterations of the critical line algorithm, a strictly positive natural integer; defaults to 1000.
* @param {Array.<number>} opt.constraints.minWeights an array of size n (l_i),i=1..n containing the minimum weights for the assets to include in the portfolios with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of zeros.
* @param {Array.<number>} opt.constraints.maxWeights an array of size n (u_i),i=1..n containing the minimum weights for the assets to include in the portfolios with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of ones.
* @return {Array<Array.<Object>>} the list of all corner portfolios as well as their associated risk aversion parameter, an array made of arrays of two elements:
* - The corner portfolio weights, a n by 1 Matrix_ of n real numbers
* - The corner portfolio risk aversion parameter, a positive real number
*
* @example
* computeCornerPortfolios_(new Matrix_([0.1, 0.2]), new Matrix_([[1, 0.3], [0.3, 1]]))
* // [[new Matrix_([0, 1]), 7], [new Matrix_([0.5, 0.5]), 0]] 
*/
function computeCornerPortfolios_(mu, sigma, opt) {	
	var eps = 1e-8; // the numerical zero
	
	// Internal object managing the statuses of the asset and lambda variables
	function variablesStatusManager_(nbAssets, nbEqualityConstraints) {
		// Variables statuses constants
		this.STATUS_UNDEF = -1;
		this.STATUS_IN = 0;
		this.STATUS_LOW = 1;
		this.STATUS_UP = 2;
		
		// The structure holding the variables status
		this.nbAssets = nbAssets;
		this.nbEqualityConstraints = nbEqualityConstraints;
		
		this.varIn = new BitSet_();
		this.varIn.resize(nbAssets + nbEqualityConstraints);
		this.varOut = new BitSet_();
		this.varOut.resize(nbAssets + nbEqualityConstraints);
		this.varLow = new BitSet_();
		this.varLow.resize(nbAssets + nbEqualityConstraints);
		this.varUp = new BitSet_();
		this.varUp.resize(nbAssets + nbEqualityConstraints);
			
		// Public functions to set the status of variables
		this.setIn = function(idx) {
			this.varIn.set(idx);
			this.varOut.unset(idx);
			this.varLow.unset(idx);
			this.varUp.unset(idx);
		}
		this.setOnLowerBound = function(idx) {
			this.varLow.set(idx);
			this.varOut.set(idx);
			this.varIn.unset(idx);
			this.varUp.unset(idx);
		}
		this.setOnUpperBound = function(idx) {
			this.varUp.set(idx);
			this.varOut.set(idx);
			this.varIn.unset(idx);
			this.varLow.unset(idx);
		}
		this.setLambdasIn = function() {
			for (var i = this.nbAssets + 1; i <= this.nbAssets + this.nbEqualityConstraints; ++i) {
				this.varIn.set(i);
				this.varOut.unset(i);
				this.varLow.unset(i);
				this.varUp.unset(i);
			}
		}
		this.setAssetsOnLowerBounds = function() {
			for (var i = 1; i <= this.nbAssets; ++i) {
				this.varLow.set(i);
				this.varOut.set(i);
				this.varIn.unset(i);
				this.varUp.unset(i);
			}
		}
		
		// Public functions to get the status of a variable
		this.isAsset = function(idx) {
			return (idx >= 1) && (idx <= this.nbAssets);
		}
		this.isLambda = function(idx) {
			return (idx >= this.nbAssets + 1) && (idx <= this.nbAssets + this.nbEqualityConstraints);
		}
		this.isIn = function(idx) {
			return this.varIn.get(idx);
		}
		this.isOnLowerBound = function(idx) {
			return this.varLow.get(idx);
		}
		this.isOnUpperBound = function(idx) {
			return this.varUp.get(idx);
		}
		this.isOut = function(idx) {
			return this.varOut.get(idx);
		}
		
		// Public functions to iterate over the different sets.
		this.getInIndexes = function() {
			return this.varIn.toArray();
		}
		this.getOutIndexes = function() {
			return this.varOut.toArray();
		}
	}

	// Internal function to compute the E-maximizing portfolio, 
	// c.f. the method "STARTING-SOLUTION" of the second reference, which
	// is the greedy algorithm used to solve the continuous knapsack problem,
	// c.f. https://en.wikipedia.org/wiki/Continuous_knapsack_problem.
	//
	// This function replaces the simplex algorithm described in the
	// chapter 8 of the first reference in case:
	// - The only equality constraint on the assets is that their weights
	// sum to one
	//
	// - The only inequality constraints on the assets are positive lower bounds
	// and upper bounds on their weights
	//
	// - There is a unique optimal solution to the E-maximizing portfolio linear 
	// program
	function computeMaxReturnPortfolio_(mu, lowerBounds, upperBounds) {		
		// Check that the problem is feasible (i.e., that the restricted unit simplex on which
		// the E-maximization is taking place is not empty, c.f. paragraph 12.3.1 of the second
		// reference).
		//
		// Note: if ever needed for performances reasons, the .toArray() calls below could be
		// replaced with another way.
		var sumBounds = simplexEmptinessCheck_(nbAssets, lowerBounds.toArray(), upperBounds.toArray());
		
		// Order the assets in descending order w.r.t. their returns
		var mu_idx = typeof Uint32Array === 'function' ? new Uint32Array(nbAssets) : new Array(nbAssets);
		for (var j = 0; j < nbAssets; ++j) {		
			mu_idx[j] = j + 1;
		}
		mu_idx.sort(function(a, b) { 
			return mu.getValue(b, 1) - mu.getValue(a, 1);
		});

		// Check that the assets returns are all distinct, which is a sufficient condition
		// for the unicity of the E-maximizing portfolio.
		for (var i = 1; i < nbAssets; ++i) {
			if (mu.getValue(mu_idx[i], 1) == mu.getValue(mu_idx[i-1], 1)) {
				throw new Error('unsupported problem detected');
			}
		}

		// Initialize the E-maximizing portfolio weights with the assets lower bounds
		var maxReturnWeights = new Matrix_(lowerBounds);
		
		// Set the assets statuses to LOW
		variablesStatusManager.setAssetsOnLowerBounds();
	
		// Starting from the asset with the highest return, set each asset weight to its
		// highest possible value until the sum of the weights of all the assets is equal
		// to one.
		var delta_sum_weights = 1 - maxReturnWeights.sum();
		var idx_i = -1;
		for (var i = 0; i < nbAssets; ++i) {	
			// In case the new delta sum of the weights of all the assets is
			// numerically equal to zero, the loop can be stopped.
			if (Math.abs(delta_sum_weights) <= eps) {
				break;
			}
			
			// Extract the asset index and its current weight
			idx_i = mu_idx[i];
			var weight_asset = maxReturnWeights.getValue(idx_i, 1);
						
			// Compute the highest possible value for the increment in the asset weight
			var inc_weight_asset = Math.min(upperBounds.getValue(idx_i, 1) - weight_asset, delta_sum_weights);
			
			// Set the new weight of the asset, together with its status
			var new_weight_asset = weight_asset + inc_weight_asset;
			if (new_weight_asset >= upperBounds.getValue(idx_i, 1)) {			
				// In this case, as the highest possible weight for an asset is its upper bound, 
				// the asset weight must be capped to its upper bound.
				maxReturnWeights.setValue(idx_i, 1, upperBounds.getValue(idx_i, 1));
				
				// Set the asset UP status
				variablesStatusManager.setOnUpperBound(idx_i);
			}
			else {
				 // In this case, the asset lies strictly between its lower and upper bounds,
				 // and the new delta sum below will be zero.
				maxReturnWeights.setValue(idx_i, 1, new_weight_asset);
				
				// Set the asset IN status
				variablesStatusManager.setIn(idx_i);
			}
					
			// Compute the new delta sum of the weights of all the assets for the next iteration.
			//
			// Note: doing the computation this way (i.e. without calling .sum() again) allows
			// for a more efficient algorithm, at the price of a slight loss of numerical 
			// precision.
			delta_sum_weights -= inc_weight_asset;

		}

		// At this stage, there are four possibilities:
		// - The loop above has not started because the sum of the initial weights of all
		// the assets (i.e., their lower bounds) is numerically equal to one
		//
		// In this case, all assets are LOW plus the linear program is degenerate
		//
		//
		// - The loop above has not prematurely stopped, which implies - because the linear
		// program is feasible - that the sum of the upper bounds of all the assets is numerically
		// equal to one
		//
		// In this case, all assets are UP, plus the linear program is degenerate
		//
		// (In both cases above, there is no real issue as the efficient frontier is then made
		// of only one portfolio, the E-maximizing portfolio, c.f. paragraph 12.3.1 of the 
		// second reference, so that the critical line algorithm will not be started.)
		//
		//
		// - The loop above has stopped on an asset because this asset lies strictly between 
		// its lower bound and its upper bound
		//
		// In this case, this asset is IN, all the assets with a return strictly higher than 
		// this asset are UP, and all the assets with a return strictly lower than this asset
		// are LOW, plus the linear program is not degenerate
		//
		//
		// - The loop above has stopped on an asset because the sum of the weights of 
		// all the assets is numerically equal to one
		//
		// In this case, all the assets with a return strictly higher than this asset are UP,
		// this asset is UP, and all the assets with a return strictly lower than this asset
		// are LOW, plus the linear program is degenerate
		//
		// To circumvent the degeneracy, this asset is forced to IN thanks to a numerical 
		// perturbation of its upper bound (its weight is already strictly greater than its
		// lower bound, otherwise, the loop would have stopped on the previous asset)
		if (idx_i == -1 || i == nbAssets) {
			// First two cases above, nothing to do
		}
		else {
			// Last two cases above
			if (variablesStatusManager.isIn(idx_i)) {
				// Nothing to do
			}
			else {
				// Force the asset on which the loop has stopped 
				// (i.e., the last UP asset) to IN.
				variablesStatusManager.setIn(idx_i);
				
				// In order to justify the asset change from UP to IN,
				// numerically alter the asset upper bound.
				upperBounds.setValue(idx_i, 1, 
									 upperBounds.getValue(idx_i, 1) + 2*eps);
			}
		}

		// Return the computed portfolio weights
		return maxReturnWeights;
	}
	
	
	// ------
	
	
	// TODO: Checks, if enabled

	// Decode options
	if (opt === undefined) {
		opt = { constraints: {} };
	}
	if (opt.constraints  === undefined) {
		opt.constraints = {};
	}
	var maxIterations = opt.maxIter || 1000;
	var lowerBounds = opt.constraints.minWeights;
	var upperBounds = opt.constraints.maxWeights;
	

	// ------
	
	// Initializations	
	var nbAssets = sigma.nbColumns;
	
	// The only equality constraint supported by the algorithm below
	// is that the weights of the assets must sum to one, but variables
	// below are kept generic.
	var A = Matrix_.ones(1, nbAssets); // the matrix holding the equality constraints
	var nbEqualityConstraints = A.nbRows; // the number of equality constraints 
	var b = Matrix_.ones(1, 1); // the vector holding the right member of the equality constraints
	
	var lb = lowerBounds ? new Matrix_(lowerBounds) : Matrix_.zeros(nbAssets, 1);
	var ub = upperBounds ? new Matrix_(upperBounds) : Matrix_.ones(nbAssets, 1);
	
	var cornerPortfoliosWeights = [];
	var currentCornerPortfolioWeights = null;
	
	var variablesStatusManager = new variablesStatusManager_(nbAssets, nbEqualityConstraints);
	
	// ----	
	
	
	// Step 1: compute the rightmost corner portfolio, corresponding to the E-maximizing 
	// portfolio (i.e., the portfolio achieving the maximum return), c.f. chapter 8 of the
	// first reference and paragraph 12.3.1 of the second reference.
	//
	// To be noted that if there is more than one E-maximizing portfolio, the critical line 
	// algorithm requires a specific E-maximizing portfolio to be computed, c.f. chapter 8 
	// of the first reference (the E-maximizing portfolio with the lowest volatility).
	//
	// As such a computation is not supported by the algorithm below, the efficient frontier
	// computation is limited to the case when all assets have different returns, which is a 
	// sufficient condition to guarantee the unicity of the E-maximizing portfolio.
	//
	// A practical workaround to this issue, suggested in chapter 9 of the first reference, 
	// is to slightly alter the assets returns and to relaunch the algorithm.
	currentCornerPortfolioWeights = computeMaxReturnPortfolio_(mu, lb, ub);
	var Ai = Matrix_.ones(1, 1);

	
	// Step 1 bis: eliminate degenerate cases when the whole efficient frontier 
	// consists of only one portfolio (i.e., sum l_i = 1 or sum u_i = 1).
	if (Math.abs(1 - lb.sum()) <= eps || Math.abs(1 - ub.sum()) <= eps) {
		cornerPortfoliosWeights.push([currentCornerPortfolioWeights, 0]);
		return cornerPortfoliosWeights;
	}

	
	// Step 2: Initialization of the critical line algorithm, c.f. chapter 13 of the 
	// first reference, paragraph "The Critical Line Algorithm, Setting Up for the CLA",
	// and chapter 13 of the first reference, paragraph 
	// "The Critical Line Algorithm, Appendix A, Module CLA, <C1>-<C6>".	

	// Get the new IN/OUT variables indexes
	//
	// At this stage, only assets variables are set
	var assetsInIdx = variablesStatusManager.getInIndexes();
	var assetsOutIdx = variablesStatusManager.getOutIndexes();


	// Initialize of the xi vector
	var xi = Matrix_.zeros(nbAssets + nbEqualityConstraints, 1);

	
	// Initialize the OUT elements of alpha and beta vectors,
	// c.f. formula 13.16 of the first reference:
	// - alpha(out) = X(out)
	// - beta(out) = 0	
	var alpha = Matrix_.zeros(nbAssets + nbEqualityConstraints, 1);
	for (var i = 1; i <= assetsOutIdx.length; ++i) {
		var out_idx_i = assetsOutIdx[i-1];
		
		alpha.setValue(out_idx_i, 1, 
					   currentCornerPortfolioWeights.getValue(out_idx_i, 1));
	}
	var beta = Matrix_.zeros(nbAssets + nbEqualityConstraints, 1);

		
	// Construct the matrix M, with M = [[Sigma A^t], [A 0]],
	// c.f. formula 13.8 of the first reference.
	//
	// Note: the memory used for allocating matrix M is suboptimal,
	// as the matrices Sigma and A are already allocated.
	//
	// This "problem" could be solved through defining M as a matrix
	// defined through a function.
	var M = Matrix_.fill(nbAssets + nbEqualityConstraints, nbAssets + nbEqualityConstraints, 
								function(i,j) { 
									if (i <= nbAssets && j <= nbAssets) {
										return sigma.data[(i-1)*sigma.nbColumns + (j-1)]; // Sigma(i, j)
									}
									else if (i >= nbAssets + 1 && j <= nbAssets) {
										return A.data[(i-nbAssets-1)*A.nbColumns + (j-1)]; // A(i-nbAssets, j)
									}
									else if (i <= nbAssets && j >= nbAssets + 1) {
										return A.data[(j-nbAssets-1)*A.nbColumns + (i-1)]; // A(j-nbAssets, i) == A(i-nbAssets, j)^t
									}
									else {
										return 0;
									}
								});	


	// Construct the Mi matrix, c.f. formula 13.19 of the first reference,
	// Mi = [0 Ai], [Ai^t -Ai^t * Sigma(IN, IN) * Ai]].
	//
	// Because the only equality constraint supported by the algorithm below is
	// that the sum of the assets weights must be equal to 1, there is only one
	// asset IN at this step, and the matrices A_in and Ai of the first reference
	// are then both equal to (1).
	//
	// To be noted, though, that the code below is generic, so that A_in and Ai 
	// are supposed to be nbEqualityConstraints by nbEqualityConstraints matrices since
	// there is nbEqualityConstraints assets IN at this step.
	//
	// As a consequence of this genericity, and for ease of subsequent computations, 
	// a full matrix is allocated for storing Mi instead of a 
	// (nbEqualityConstraints+1) by (nbEqualityConstraints+1) matrix.
	var Mi = Matrix_.zeros(nbAssets + nbEqualityConstraints, nbAssets + nbEqualityConstraints);
		
	// Copy the matrix Ai in the upper right portion of the matrix Mi
	// Copy the matrix Ai^t into the lower left portion of the matrix Mi
	// Copy the matrix -Ai^t * Sigma(IN, IN) * Ai into the lower right portion of the matrix Mi
	var T = Matrix_.atxy(-1, Ai, Matrix_.xy(sigma.submatrix(assetsInIdx, assetsInIdx), Ai));
	for (var j = 1; j <= assetsInIdx.length; ++j) {
		for (var k = 1; k <= assetsInIdx.length; ++k) {
			var var_in_idx_j = assetsInIdx[j-1];
			
			var Ai_j_k = Ai.getValue(j, k);
			Mi.setValue(nbAssets + k, var_in_idx_j, 
						Ai_j_k);		
			Mi.setValue(var_in_idx_j, nbAssets + k, 
						Ai_j_k);
			
			Mi.setValue(nbAssets + j, nbAssets + k, 
						T.getValue(j, k)); 
		}
	}

		
	// Add the lambda variables to the IN set
	variablesStatusManager.setLambdasIn();

	
	// Construct the b_bar vector, c.f. formula 13.14 of the first reference,
	// b_bar(in) = [0 b]^t - M(in, out) * X(out)
	
	// Construct the b_bar vector for the assets variables IN
	var b_bar = Matrix_.zeros(nbAssets + nbEqualityConstraints, 1);
	for (var i = 1; i <= assetsInIdx.length; ++i) {
		var in_idx_i = assetsInIdx[i-1];
		
		// Initialization of b_bar(idx_in(i)) with [0 b]^t(idx_in(i))
		var b_bar_in_idx_i = 0;

		// Computation of the remaining part of b_bar(idx_in(i))
		for (var j = 1; j <= assetsOutIdx.length; ++j) {
			var out_idx_j = assetsOutIdx[j-1];
			
			b_bar_in_idx_i -= M.getValue(in_idx_i, out_idx_j) * currentCornerPortfolioWeights.getValue(out_idx_j, 1);
		}
		b_bar.setValue(in_idx_i, 1, 
					   b_bar_in_idx_i);
	}
	
	// Construct the b_bar vector for the lambda variables IN (with indexes from
	// nbAssets + 1 to nbAssets + nbEqualityConstraints), which have been
	// added to the IN set just before the b_bar vector computation step.
	for (var i = nbAssets + 1; i <= nbAssets + nbEqualityConstraints; ++i) {
		var in_idx_i = i;
		
		// Initialization of b_bar(idx_in(i)) with [0 b]^t(idx_in(i))
		var b_bar_in_idx_i = b.getValue(in_idx_i-nbAssets, 1);
		
		// Computation of the remaining part of b_bar(idx_in(i))
		for (var j = 1; j <= assetsOutIdx.length; ++j) {
			var out_idx_j = assetsOutIdx[j-1];
			
			b_bar_in_idx_i -= M.getValue(in_idx_i, out_idx_j) * currentCornerPortfolioWeights.getValue(out_idx_j, 1);
		}
		b_bar.setValue(in_idx_i, 1, 
					   b_bar_in_idx_i);
	}	
	
	
	// Step 3: Main loop of the critical line algorithm, c.f. chapter 13 of the 
	// first reference, paragraph "The Critical Line Algorithm, CLA Iteration",
	// and chapter 13 of the first reference, paragraph 
	// "The Critical Line Algorithm, Appendix A, Module CLA, <C10>-<C14>".

	// In each iteration (except the first one), the asset that was determined 
	// by the previous iteration to become IN or to become OUT is done so.
	//
	// The different lambdas (lambda_out and lambda_in) are then updated in order 
	// to compute the value of lambda_e corresponding to the next corner portfolio.
	//
	// Once lambda_e is known, the weights of the next corner portfolio can be
	// computed, and the process continues until the value of lambda_e becomes
	// null or negative.
	var iter = 0;
	var lambda_e = 0;	
	var idx_out = -1;
	var lambda_out = 0;
	var status_out = variablesStatusManager.STATUS_UNDEF;
	var idx_in = -1;
	var lambda_in = 0;
	while (true) {
		// Check the number of iterations
		if (maxIterations !== -1 && iter >= maxIterations) {
			throw new Error('maximum number of iterations reached: ' + maxIterations);
		}

		
		// Update the number of iterations
		++iter;
		
		
		// In case this iteration is not the first one, set the new status of the assets
		// determined by the previous iteration.
		if (iter >= 2) {
			if (lambda_out >= lambda_in) { // an asset IN goes OUT
				// Update the vectors alpha and beta for the asset idx_out going OUT,
				// c.f. formula 13.16 of the first reference:
				// - alpha(idx_out) = X(idx_out)
				// - beta(idx_out) = 0
				alpha.setValue(idx_out, 1, 
							   currentCornerPortfolioWeights.getValue(idx_out, 1));
				beta.setValue(idx_out, 1, 
							  0);
				
				
				// Set the asset idx_out to OUT, with the proper LOW or UP status
				if (status_out == variablesStatusManager.STATUS_LOW) {
					variablesStatusManager.setOnLowerBound(idx_out);
				}
				else {
					variablesStatusManager.setOnUpperBound(idx_out);
				}

				
				// Get the new IN variables indexes
				var variablesInIdx = variablesStatusManager.getInIndexes();
				
				
				// Update the matrix Mi for the asset idx_out going OUT,
				// c.f. formula 13.20 of the reference, reversed:
				// Mi(NEW_IN,NEW_IN) -= Mi(NEW_IN, idx_out) * Mi(idx_out, NEW_IN) / Mi(idx_out, idx_out), with NEW_IN = IN \ {idx_out}
				//
				// Numerical note: C.f. chapter 13 of the reference, paragraph "Deleting a variable",
				// the element Mi_out_idx_out_idx below is such that 1/Mi_out_idx_out_idx is strictly positive.
				//
				//                 So, in case it becomes numerically negative or zero (covariance matrix numerically
				// not semi-definite positive, ill-conditioned...), it is needed to truncate it.
				var Mi_out_idx_out_idx = Mi.getValue(idx_out, idx_out);				
				if (Mi_out_idx_out_idx <= eps) {
					Mi_out_idx_out_idx = eps;
				}
				for (var i = 1; i <= variablesInIdx.length; ++i) {
					var in_idx_i = variablesInIdx[i-1];
					
					for (var j = 1; j <= variablesInIdx.length; ++j) {
						var in_idx_j = variablesInIdx[j-1];
						
						Mi.setValue(in_idx_i, in_idx_j, 
								    Mi.getValue(in_idx_i, in_idx_j) - Mi.getValue(in_idx_i, idx_out) * Mi.getValue(idx_out, in_idx_j) / Mi_out_idx_out_idx);
					}
					
				}
				
				
				// Update the b_bar vector, c.f. formula 13.22 of the 
				// first reference, reversed:
				// - b_bar(NEW_IN) -= M(NEW_IN, idx_out) * X(idx_out), with NEW_IN = IN \ {idx_out}
				for (var i = 1; i <= variablesInIdx.length; ++i) {
					var in_idx_i = variablesInIdx[i-1];
					
					b_bar.setValue(in_idx_i, 1, 
								   b_bar.getValue(in_idx_i, 1) - M.getValue(in_idx_i, idx_out) * currentCornerPortfolioWeights.getValue(idx_out, 1));
				}
			}
			else { // an asset OUT goes IN				
				// Get the current IN variables indexes
				var variablesInIdx = variablesStatusManager.getInIndexes();

				
				// Update the matrix Mi for the asset idx_in going IN,
				// c.f. formula 13.20 of the first reference:
				// - xi = Mi(IN,IN) * M(IN, idx_in)
				// - xi_j = M(idx_in, idx_in) - <M(IN, idx_in)/xi>
				//
				// - Mi(IN, IN) += (xi * xi^t)(IN, IN) / xi_j
				// - Mi(idx_in, IN) = Mi(IN, idx_in) = -xi(IN) / xi_j
				// - Mi(idx_in, idx_in) = 1 / xi_j
								
				// Compute the vector xi
				for (var i = 1; i <= variablesInIdx.length; ++i) {
					var in_idx_i = variablesInIdx[i-1];
					
					var xi_in_idx_i = 0;
					for (var j = 1; j <= variablesInIdx.length; ++j) {
						var in_idx_j = variablesInIdx[j-1];
						
						xi_in_idx_i += Mi.getValue(in_idx_i, in_idx_j) * M.getValue(in_idx_j, idx_in);
					}	
					xi.setValue(in_idx_i, 1, 
								xi_in_idx_i);
				}
				
				// Compute the scalar xi_j
				//
				// Numerical note: C.f. chapter 13 of the reference, paragraph "Adding a variable",
				// the element xi_j below is such that xi_j is strictly positive.
				//
				//                 So, in case it becomes numerically negative or zero (covariance matrix numerically
				// not semi-definite positive, ill-conditioned...), it is needed to truncate it.
				var xi_j = M.getValue(idx_in, idx_in);
				for (var i = 1; i <= variablesInIdx.length; ++i) {
					var in_idx_i = variablesInIdx[i-1];
					
					xi_j -= M.getValue(idx_in, in_idx_i) * xi.getValue(in_idx_i, 1);
				}
				if (xi_j <= eps) {
					xi_j = eps;
				}
				
				// Update the matrix Mi
				for (var i = 1; i <= variablesInIdx.length; ++i) {
					var in_idx_i = variablesInIdx[i-1];
					
					for (var j = 1; j <= variablesInIdx.length; ++j) {
						var in_idx_j = variablesInIdx[j-1];
						
						Mi.setValue(in_idx_i, in_idx_j, 
									Mi.getValue(in_idx_i, in_idx_j) + xi.getValue(in_idx_i, 1) * xi.getValue(in_idx_j, 1) / xi_j);
					}
					Mi.setValue(in_idx_i, idx_in, 
								-xi.getValue(in_idx_i, 1)/xi_j);
					Mi.setValue(idx_in, in_idx_i, 
								-xi.getValue(in_idx_i, 1)/xi_j);
				}
				Mi.setValue(idx_in, idx_in, 
							1/xi_j);
				
				
				// Update the b_bar vector, c.f. formulas 13.21 and 13.22 of the 
				// first reference:
				// - b_bar(IN) += M(IN, idx_in) * X(idx_in)
				// - b_bar(idx_in) = -M(idx_in, NEW_OUT) * X(NEW_OUT), with NEW_OUT = OUT \ {idx_in}
				
				// Update the b_bar vector for the current IN variables
				for (var i = 1; i <= variablesInIdx.length; ++i) {
					var in_idx_i = variablesInIdx[i-1];
					
					b_bar.setValue(in_idx_i, 1, 
								   b_bar.getValue(in_idx_i, 1) + M.getValue(in_idx_i, idx_in) * currentCornerPortfolioWeights.getValue(idx_in, 1));
				}
								
				// Set the asset idx_in as IN
				variablesStatusManager.setIn(idx_in);
				
				// Get the new OUT variables indexes, which consists of only assets per construction
				var assetsOutIdx = variablesStatusManager.getOutIndexes();
				
				// Update the b_bar vector for the new IN asset
				var b_bar_in_idx_i = 0;
				for (var i = 1; i <= assetsOutIdx.length; ++i) {
					var out_idx_i = assetsOutIdx[i-1];
					
					b_bar_in_idx_i -= M.getValue(idx_in, out_idx_i) * currentCornerPortfolioWeights.getValue(out_idx_i, 1);
				}
				b_bar.setValue(idx_in, 1, 
							   b_bar_in_idx_i);
				
			}
		}
		
		// Get the new IN/OUT variables indexes
		var variablesInIdx = variablesStatusManager.getInIndexes();
		var assetsOutIdx = variablesStatusManager.getOutIndexes(); // only assets indexes per construction
		
		
		// Determine the next asset IN to be set OUT

		// Update the alpha vector, c.f. formula 13.15 of the first reference:
		// - alpha(IN) = Mi(IN,IN) * b_bar(IN)
		//
		// Update the beta vector, c.f. formula 13.16 of the first reference:
		// - beta(IN) = Mi(IN,IN) * [mu(IN) 0]^t
		//
		// Compute lambda_out, c.f. formula 13.17 of the first reference:
		// - lambda_out = max( (L(i) - alpha(i))/beta(i), beta(i) > 0, i in IN; (U(i) - alpha(i))/beta(i), beta(i) < 0, i in IN)
		idx_out = -1;
		lambda_out = 0;
		status_out = variablesStatusManager.STATUS_UNDEF;
		for (var i = 1; i <= variablesInIdx.length; ++i) {
			var in_idx_i = variablesInIdx[i-1];

			// For all variables IN, compute alpha(idx_in(i)) and beta(idx_in(i))
			var alpha_in_idx_i = 0;
			var beta_in_idx_i = 0;
			for (var j = 1; j <= variablesInIdx.length; ++j) {
				var in_idx_j = variablesInIdx[j-1];
				
				alpha_in_idx_i += Mi.getValue(in_idx_i, in_idx_j) * b_bar.getValue(in_idx_j, 1);
			
				if (in_idx_j <= nbAssets) {
					beta_in_idx_i += Mi.getValue(in_idx_i, in_idx_j) * mu.getValue(in_idx_j, 1);
				}
			}
			alpha.setValue(in_idx_i, 1, 
						   alpha_in_idx_i);
			beta.setValue(in_idx_i, 1, 
						  beta_in_idx_i);
			
			
			// For assets variables IN, proceed with the formula 13.17
			if (variablesStatusManager.isAsset(in_idx_i)) {
				// Check for asset reaching the lower limit lb
				if (beta_in_idx_i > eps) {
					var lb_idx_in_i = lb.getValue(in_idx_i, 1);
					
					var tmp_lambda_out = (lb_idx_in_i - alpha_in_idx_i)/beta_in_idx_i;
					if (tmp_lambda_out >= lambda_out) {
						idx_out = in_idx_i;
						lambda_out = tmp_lambda_out;
						status_out = variablesStatusManager.STATUS_LOW;
					}
				}
				
				// Check for asset reaching the upper limit ub
				else if (beta_in_idx_i < -eps) {
					var ub_idx_in_i = ub.getValue(in_idx_i, 1);
					
					var tmp_lambda_out = (ub_idx_in_i - alpha_in_idx_i)/beta_in_idx_i;
					if (tmp_lambda_out >= lambda_out) {
						idx_out = in_idx_i;
						lambda_out = tmp_lambda_out;
						status_out = variablesStatusManager.STATUS_UP;
					}
				}
			}
		}


		// Determine the next asset OUT to be set IN
		
		// Compute the gamma and delta vectors, c.f. formula 7.10b of the first reference:
		// - gamma(OUT) = [C A^t](OUT, ALL) * alpha, gamma(IN) = 0
		// - delta(OUT) = [C A^t](OUT, ALL) * beta - mu(OUT), delta(IN) = 0
		//
		// In parallel, compute lambda_in, c.f. formula 13.18 of the first reference:
		// - lambda_in = max( -gamma(i)/delta(i), delta(i) > 0, i in LO; -gamma(i)/delta(i), delta(i) < 0, i in UP)
		idx_in = -1;
		lambda_in = 0;
		for (var i = 1; i <= assetsOutIdx.length; ++i) {
			var out_idx_i = assetsOutIdx[i-1];
			
			// Compute gamma(idx_out(i)) and delta(idx_out(i))
			var gamma_out_idx_i = 0;
			var delta_out_idx_i = -mu.getValue(out_idx_i, 1);
			for (var j = 1; j <= nbAssets + nbEqualityConstraints; ++j) {
				var M_out_idx_i_j = M.getValue(out_idx_i, j);
				
				gamma_out_idx_i += M_out_idx_i_j * alpha.getValue(j, 1);
				delta_out_idx_i += M_out_idx_i_j * beta.getValue(j, 1);
			}
			
			// Check for eta_i reaching zero
			// Check for asset coming off lower limit
			if (variablesStatusManager.isOnLowerBound(out_idx_i)) {
				if (delta_out_idx_i > eps) {
					var tmp_lambda_in = -gamma_out_idx_i/delta_out_idx_i;
				
					if (tmp_lambda_in >= lambda_in) {
						idx_in = out_idx_i;
						lambda_in = tmp_lambda_in;
					}
				}
			}
			// Check for asset coming off upper limit
			else {
				if (delta_out_idx_i < -eps) {
					var tmp_lambda_in = -gamma_out_idx_i/delta_out_idx_i;
					
					if (tmp_lambda_in >= lambda_in) {
						idx_in = out_idx_i;
						lambda_in = tmp_lambda_in;
					}
				}
			}
		}

		
		// The value of lambda_e for the next corner portfolio is the maximum of
		// the two lambda_out and lambda_in computed above.
		//
		// In case lambda_e == lambda_out, it means an asset first goes OUT as lambda_e
		// is decreased; otherwise, in case lambda_e == lambda_in, it means an asset
		// first goes IN as lambda_e is decreased.
		lambda_e = Math.max(lambda_out, lambda_in, 0);
		
		
		// Compute the weights of the next corner portfolio
		for (var i = 1; i <= variablesInIdx.length; ++i) {
			var in_idx_i = variablesInIdx[i-1];
			
			// In case the variable IN is an asset variable, update the current corner portfolio
			if (variablesStatusManager.isAsset(in_idx_i)) {
				currentCornerPortfolioWeights.setValue(in_idx_i, 1, 
													   alpha.getValue(in_idx_i, 1) + lambda_e * beta.getValue(in_idx_i, 1));
			}
		}
		
		// Save the current corner portfolio
		cornerPortfoliosWeights.push([new Matrix_(currentCornerPortfolioWeights), lambda_e]);

		
		// When the value of lambda_e becomes numerically null or negative, the critical
		// line algorithm can be stopped.
		if (lambda_e < eps) {
			break;
		}
	}
	
	
	// Return the computed efficient frontier array
	return cornerPortfoliosWeights;	
}

/**
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 


/**
* @function minimaxWeights
*
* @summary Compute the weights of a minimax portfolio.
*
* @description This function returns the weights w_1,...,w_n associated to a fully invested and long-only 
* minimax portfolio of n assets.
*
* Optionally, the following constraint can be added:
* - Partial investment constraint, replacing the full investment constraint
*
* A minimax portfolio has the property that it maximizes the minimum possible return over the period on which it is computed,
* c.f. the first reference.
*
* This portfolio might not be unique.
*
* @see <a href="http://www.jstor.org/stable/2634472">Young, M. (1998). A Minimax Portfolio Selection Rule with Linear Programming Solution. Management Science, 44(5), 673-683.</a>
* @see <a href="https://link.springer.com/article/10.1007/s11135-005-1054-0">Yuanyao Ding, (2006), Portfolio Selection under Maximum Minimum Criterion, Quality & Quantity: International Journal of Methodology, 40, (3), 457-468</a>
*
* @param {Array.<Array.<number>>} assetsReturns an array of n arrays of T real numbers, 
* with assetsReturns[i-1][j-1] the return of the i-th asset for the j-th period of time,
* i = 1..n, j = 1..T..
* @param {object} opt optional parameters for the algorithm.
* @param {boolean} opt.constraints.fullInvestment parameter set to false in case the full investment constraint of the portfolio must be replaced
* by a partial investment constraint; defaults to true.
* @param {boolean} opt.outputMinimumPortfolioReturn a boolean indicating whether the computed minimum portfolio return should be provided in output
* (if set to true) or not (if set to false); defaults to false.
* @return {Array.<Object>|Array.<number>} if opt.outputMinimumPortfolioReturn is set to true, an array arr of two elements:
* - arr[0], the weights corresponding to a minimax portfolio, array of n real numbers
* - arr[1], the computed minimum portfolio return, a real number
*
* otherwise, the weights corresponding to a minimax portfolio, an array of n real numbers.
*
* @example
* minimaxWeights([[0.01, -0.02, 0.01], [-0.05, 0.03, 0.01]]);
* // ~[ 0.727, 0.273 ]
*/
self.minimaxWeights = function (assetsReturns, opt) {
	// TODO: Checks, if enabled

	// Decode options
	if (opt === undefined) {
		opt = { constraints: {} };
	}
	if (opt.constraints  === undefined) {
		opt.constraints = {};
	}
	var fullInvestmentContraint = true;
	if (opt.constraints.fullInvestment !== undefined) {
		fullInvestmentContraint = opt.constraints.fullInvestment;
	}
	var outputMinimumPortfolioReturn = false || opt.outputMinimumPortfolioReturn; 
	
	// Initializations
	var nbAssets = assetsReturns.length;
	var nbPeriods = assetsReturns[0].length;
	
	
	// ----
	
	// The minimax portfolio is the solution to a linear programming problem,
	// choosen to be the one of the formula 21 of the second reference instead of
	// the one of the section 1.1 of the first reference.
	//
	// In other words, no minimum return is imposed on the portfolio, 
	// so that the linear program is always feasible.

		// Build the objective function (c.f. formula 1a of the first reference):
		// - Maximize the minimum portfolio return
	var c = Matrix_.fill(nbAssets + 1, 1, function(i,j) { return i <= nbAssets ? 0 : -1; }); // c = [0,...,0,-1]
	
		// Build the equality constraints (c.f. formula 1d of the first reference
		// for the equivalent inequality constraint):
		// - Full investment (optional)
	var Ae = null;
	var be = null;
	if (fullInvestmentContraint) {
		Ae = Matrix_.fill(1, nbAssets + 1, function(i,j) { return j <= nbAssets ? 1 : 0; }); // Ae = [1,...,1,0]
		be = Matrix_.ones(1,1); // be = [1]
	}
	
		// Build the inequality constraints (c.f. formula 1b of the first reference):
		// - Portfolio return greater than or equal to the minimum portfolio return, for each period
		// - Partial investment (optional)
	var Ai = Matrix_.fill(nbPeriods + (fullInvestmentContraint ? 0 : 1), nbAssets + 1, 
						  function(i,j) { 
								if (i <= nbPeriods) { return j <= nbAssets ? -assetsReturns[j-1][i-1] : 1; }
								else if (i == nbPeriods + 1) { return j <= nbAssets ? 1 : 0; }
						  }); // Ai = [[-ret11,...,-retN1,1], ..., [-ret1T,...,-retNT,1] (optional: , [1,...,1,0])]
	var bi = Matrix_.fill(nbPeriods + (fullInvestmentContraint ? 0 : 1), 1, 
						  function(i,j) { 
							  if (i <= nbPeriods) { return 0; }
							  else if (i == nbPeriods + 1) { return 1; }
						  }); // bi = [0, ..., 0 (optional: , 1)]
	
		// Build the bound constraints (c.f. formula 1e of the first reference
		// as well as the definition of M_p):
		// - No short sales
		// - Absence of leverage
		// - Unbounded minimum portfolio return
	var lb = Matrix_.fill(nbAssets + 1, 1, function(i,j) { return i <= nbAssets ? 0 : -Infinity; }); // lb = [0,...,0, -Infinity]
	var ub = Matrix_.fill(nbAssets + 1, 1, function(i,j) { return i <= nbAssets ? 1 : Infinity; });  // ub = [1,...,1, Infinity]
	
		// Solve the constructed linear program, which is:
		// - Bounded: the portfolio weights belong to the unit simplex
		//            the minimum portfolio return is bounded below by the minimum portfolio return over all the periods
		// - Feasible: the portfolio with the minimum return over all the periods is a solution to the linear program
		//
		// Note: given the assumptions above, the convergence of the primal-dual hybrid gradient algorithm is guaranteed.
	var lpSolution = lpsolvePDHG_(Ae, be, Ai, bi, c, lb, ub, {maxIter: -1});
	
	
	// ----
	
	// Extract the computed portfolio weights, plus the minimum portfolio return.
	var sol = lpSolution[0];
	var weights = sol.toArray(function(i, j, val) { return i != nbAssets + 1; });
	var minPortfolioReturn = sol.data[nbAssets];

	// Return the computed weights, and potentially return the minimum
	// portfolio return.
	if (outputMinimumPortfolioReturn === true) {
		return [weights, minPortfolioReturn];
	}
	else {
		return weights;
	}
}

/**
 * @file Functions related to minimum correlation (heuristic) portfolio.
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 


/**
* @function minimumCorrelationWeights
*
* @summary Compute the weights of the minimum correlation (heuristic) portfolio.
*
* @description This function returns the weights w_1,...,w_n associated to the fully invested and long-only 
* minimum correlation (heuristic) portfolio of n assets, as computed by the minimum correlation algorithm of the reference.
*
* This portfolio is unique.
* 
* This portfolio is meant to approximate the most diversified portfolio (MDP).
*
* The algorithm used is the minimum correlation algorithm (MCA), with primary benefits versus the conventional optimization methods:
* - speed of computation and ease of calculation 
* - greater robustness to estimation error
* - superior risk dispersion
*
* @see <a href="www.systematicportfolio.com/mincorr_paper.pdf">David Varadi, Michael Kapler, Henry Bee, Corey Rittenhouse, Sep. 2012, The Minimum Correlation Algorithm: A Practical Diversification Tool</a>
*
* @param {Matrix_|Array.<Array.<number>>} sigma the covariance matrix (sigma_ij),i,j=1..n of the n assets in the considered universe, square Matrix or array of n array of n real numbers statisfying sigma[i-1][j-1] = sigma_ij.
* @param {object} opt the optional parameters for the algorithm, unused.
* @return {Array.<number>} the weights corresponding to theminimum correlation (heuristic) portfolio, array of n real numbers.
*
* @example
* minimumCorrelationWeights([[0.1, 0], [0, 0.2]]);
* // ~[0.59, 0.41]
*/
self.minimumCorrelationWeights = function (sigma, opt) {
	// Convert sigma to covariance matrix format
	var sigma = new Matrix_(sigma).toCovarianceMatrix();
	
	// Extract the correlation matrix and the misc. variances-related vectors
	var variances = sigma.getVariances();
	var invStddevs = variances.elemMap(function(i,j,val) { return 1/Math.sqrt(val); });
	var rho = sigma.getCorrelationMatrix();

	// TODO: Checks, if enabled	
	
	// ------
	var nbAssets = rho.nbRows;
	
	// Specific case to be filtered out: number of assets is 2 (or 1, but this case is less useful)
	if (nbAssets <= 2) {
		return self.inverseVolatilityWeights(variances, opt);
	}
	
	// Step 2: Compute mean and sample standard deviation of the correlation matrix elements
	// Note: only strict upper triangular part is considered, c.f. the example of the reference
	var elemRho = rho.toArray(function(i, j, val) {
		return j > i;
	});
	var elementsMean = mean_(elemRho);
	var elementsStddev = sampleStddev_(elemRho);

	// Step 3: Create Adjusted Correlation Matrix
	var adjustedRho = rho.elemMap(function(i, j, val) { 
			if (i == j) {
				return 0; // Necessary for step 6
			}
			else {
				return 1 - normcdf_((val - elementsMean)/elementsStddev);
			}
		});

	// Step 4: Compute average value for each row (= column, as matrix is symmetric) of the Adjusted Correlation Matrix
	// Note: only non diagonal elements are considered, c.f. the example of the reference
	var rowsElements = adjustedRho.toRowArray(function(i, j, val) {
		return i != j;
	});
	var rowsAverages = new Array(nbAssets);
	for (var i = 0; i < nbAssets; ++i) {
		rowsAverages[i] = mean_(rowsElements[i]);
	}
	
	// Step 5: Compute rank portfolio weight estimates
	// Note: ranks are computed in descending order, c.f. the example of the reference
	var ranks = rank_(rowsAverages, 0);
	var weights = new Matrix_(ranks, 1).normalize();
	
	// Step 6: Combine rank portfolio weight estimates with Adjusted Correlation Matrix
	weights = Matrix_.xy(adjustedRho, weights).normalize();
	
	// Step 7: Scale portfolio weights by assets standard deviations
	weights = Matrix_.vectorHadamardProduct(weights, invStddevs).normalize();
	
	// Return the computed weights
	return weights.toArray();
}


/**
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 


/**
* @function minimumTrackingErrorWeights
*
* @description This function returns the weights w_1,...,w_n associated to the fully invested
* and long-only portfolio of n assets which minimizes the tracking error with regard to
* a provided benchmark.
*
* The definition of the tracking error taken is described in the first and second references, and is
* the sum of the squared deviations of returns between the portfolio and the benchmark,
* i.e. the tracking error volatility.
*
* Optionally, the following constraints can be added:
* - Minimum number of assets to include in the portfolio
* - Maximum number of assets to include in the portfolio
* - Minimum weight of each asset that is included in the portfolio
* - Maximum weight of each asset that is included in the portfolio
*
* The algorithm used internally to solve the associated optimization problem is a FISTA-like 
* convex composite optimization algorithm.
*
* In case cardinality constraints are provided:
* - The associated optimization problem becomes strongly NP-hard, c.f. the second reference,
* so that an exhaustive computation of all the portfolios minimizing the tracking error 
* for each possible subset of assets is the only possible way to find an exact solution.
*
* This approach is expected to produce an exact solution within a reasonable amount of time
* for small n (e.g. n <= 15), but due to the combinatorial nature of the problem, 
* the computation for greater values of n will not be tractable, unless the maximum 
* number of assets is very small or very big compared to n.
*
* For these intractable cases, it is possible to use the heuristic optimization algorithm 
* described in the third reference, called "Threshold Accepting", which is not guaranteed
* to provide an optimal solution, but which is reasonably guaranteed to provide a "good enough" 
* solution.
*
* One caveat though, because the Threshold Accepting algorithm is stochastic, different executions
* of this algorithm might return different weights.
*
* - The minimum/maximum weight of each asset is then to be understood as applying only to
* the assets selected by the optimization algorithm to be included in the portfolio.
* So, for example, in case a minimum weight constraint is defined for a non-selected asset,
* this minimum weight constraint is discarded.
*
* @see <a href="https://doi.org/10.1016/S0378-4266%2898%2900076-4">Markus Rudolf and Hans-jurgen Wolter and Heinz Zimmermann. A linear model for tracking error minimization. Journal of Banking and Finance. 1998</a>
* @see <a href="https://doi.org/10.1016/j.cor.2017.09.002">Purity Mutunge and Dag Haugland. Minimizing the tracking error of cardinality constrained portfolios. Computers & Operations Research Volume 90, February 2018, Pages 33-41</a>
* @see <a href="https://link.springer.com/chapter/10.1007/978-1-4757-5226-7_1">Gilli M., Këllezi E. (2002) The Threshold Accepting Heuristic for Index Tracking. In: Pardalos P.M., Tsitsiringos V.K. (eds) Financial Engineering, E-commerce and Supply Chain. Applied Optimization, vol 70. Springer, Boston, MA</a>
*
* @param {Array.<Array.<number>>} assetsReturns an array of n arrays of T real numbers, 
* with assetsReturns[i-1][j-1] the return of the i-th asset for the j-th period of time,
* i = 1..n, j = 1..T.
* @param {<Array.<number>} benchmarkReturns an array of T real numbers, 
* with benchmarkReturns[j-1] the return of the benchmark for the j-th period of time,
* j = 1..T..
* @param {object} opt optional parameters for the algorithm.
* @param {number} opt.eps the tolerance parameter for the convergence of the algorithm, a strictly positive real number; defaults to 1e-04.
* @param {number} opt.maxIter the maximum number of iterations of the algorithm, a strictly positive natural integer; defaults to 10000.
* @param {number} opt.constraints.minNbAssets the minimum number of assets to include in the portfolio, an integer i satisfying 1 <= i <= nbAssets; defaults to 1 if opt.constraints.maxNbAssets is set.
* @param {number} opt.constraints.maxNbAssets the maximum number of assets to include in the portfolio, an integer j satisfying i <= j <= nbAssets; defaults to nbAssets if opt.constraints.minNbAssets is set.
* @param {string} opt.optimizationMethod the optimization method to use in order to compute the portfolio in case opt.constraints.minNbAssets or opt.constraints.maxNbAssets is set, a string either equals to:
* - 'combinatorial': usage of an exhaustive combinatorial search to exactly compute the optimal portfolio
* - 'thresholdAccepting': usage of the "Threshold Accepting" heuristic described in the third reference to approximately compute a "good enough" portfolio
; defaults to 'combinatorial'.
* @param {number} opt.optimizationMethodParams.nSteps the optional number of steps per threshold to use in case opt.optimizationMethod is equal to 'thresholdAccepting', defaults to 5000
* @param {number} opt.optimizationMethodParams.nDeltas the optional number of steps per threshold to use in case opt.optimizationMethod is equal to 'thresholdAccepting', defaults to opt.optimizationMethodParams.nSteps
* @param {number} opt.optimizationMethodParams.nRounds the optional number of random steps to generate the thresholds in case opt.optimizationMethod is equal to 'thresholdAccepting', defaults to 3
* @param {Array.<number>} opt.constraints.minWeights an array of size n (l_i),i=1..n containing the minimum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of zeros.
* @param {Array.<number>} opt.constraints.maxWeights an array of size n (u_i),i=1..n containing the maximum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of ones.
*
* @return {Array.<number>} the weights corresponding to the computed portfolio, array of n real numbers.
*
*/
self.minimumTrackingErrorWeights = function (assetsReturns, benchmarkReturns, opt) {
	// Initialize the options structure
	if (opt === undefined) {
		opt = { constraints: {} };
	}
	if (opt.constraints  === undefined) {
		opt.constraints = {};
	}
	if (opt.optimizationMethodParams === undefined) {
		opt.optimizationMethodParams = {};
	}
	
	// Initialize the options default values
	if (opt.eps === undefined) {
		opt.eps = 1e-04;
	}
	if (opt.maxIter === undefined) {
		opt.maxIter = 10000;
	}
	if (opt.constraints.minNbAssets === undefined && opt.constraints.maxNbAssets) {
		opt.constraints.minNbAssets = 1;
	}
	if (opt.constraints.maxNbAssets === undefined && opt.constraints.minNbAssets) {
		opt.constraints.maxNbAssets = assetsReturns.length;
	}
	
	// Decode the options
	var eps = opt.eps;
	var maxIterations = opt.maxIter;
	
	var minNbAssets = opt.constraints.minNbAssets;
	var maxNbAssets = opt.constraints.maxNbAssets;
	var cardinalityConstraints = minNbAssets || maxNbAssets;
	
	var lowerBounds = opt.constraints.minWeights;
	var upperBounds = opt.constraints.maxWeights;
	
	
	// In case cardinality constraints are provided, the
	// default optimization method is a combinatorial search
	// in order to compute the optimal solution.
	var optimizationMethod;
	if (cardinalityConstraints) {
		optimizationMethod = opt.optimizationMethod;
		
		if (optimizationMethod === undefined) {
			optimizationMethod = 'combinatorial';
		}
		
		if (optimizationMethod != 'combinatorial' && optimizationMethod != 'thresholdAccepting') {
			throw new Error('unsupported optimisation method');
		}
	}

	
	// Initialize the default parameters for the Threshold Accepting
	// heuristic.
	var nRounds;
	var nSteps;
	var nDeltas;
	if (optimizationMethod == 'thresholdAccepting') {
		nRounds = opt.optimizationMethodParams.nRounds;
		if (nRounds === undefined) {
			nRounds = 3;
		}
		
		nSteps = opt.optimizationMethodParams.nSteps;
		if (nSteps === undefined) {
			nSteps = 5000;
		}

		nDeltas = opt.optimizationMethodParams.nDeltas;
		if (nDeltas === undefined) {
			nDeltas = nSteps;
		}
	}
	
	// ------
	
	
	// Initializations
	var nbAssets = assetsReturns.length;
	var nbPeriods = assetsReturns[0].length;
	
	// Convert the benchmark returns to matrix format
	var benchmarkReturns = new Matrix_(benchmarkReturns);
	
	
	// ----
	

	// Internal function to compute a portfolio minimizing the tracking error
	// v.s. a provided benchmark for a given number of assets nbAssets.
	//
	// The portfolio minimizing the tracking error volatility v.s. a provided benchmark
	// is a solution to the following smooth constrained convex optimization problem, 
	// c.f. formula 2 of the first reference, and formula 4 of the second reference
	// for the formulation of the soft inequality constraints:
	//
	// argmax f(w) = 1/2 * ||X*w - Y||_2^2, with:
	// - X the nbPeriods by nbAssets matrix of returns of the assets
	// - Y the nbPeriods vector of benchmark returns
	// s.t. sum w_i = 1
	//      l <= w <= u
	//      (i.e., b belongs to a restricted unit simplex)
	//
	// This optimization problem is solved using a first-order method
	// for convex minimization.
	//
	// To be noted that in case the problem is not feasible, this method throws an exception.
	function computeMinimumTrackingErrorVolatilityPortfolio(assetsReturns, benchmarkReturns, 
															lowerBounds, upperBounds) {
		//
		var nbAssets = assetsReturns.nbColumns;
		
		// Define the matrix X
		var X = assetsReturns;

		// Define the vector Y
		var Y = benchmarkReturns;
		
		// Define the function representing f(w), the tracking error
		function f(w) {
			var te = Matrix_.xmy(Matrix_.xy(X, w), Y).vectorNorm('two');
			
			return 0.5 * te * te;
		}

		// Define the function representing the gradient of the function f(w),
		// which is equal to X^t * (X*w - Y), c.f.
		// proposition 2.1 of the second reference.
		function gradf(w) {
			var gte = Matrix_.txy(X, Matrix_.xmy(Matrix_.xy(X, w), Y));
			
			return gte;
		}

		// Define the characteristic function of the restricted unit simplex
		function g(w) {
			return simplexCharacteristicFunction_(w.data, lowerBounds, upperBounds);
		}

		// Define the proximal function associated to g, which is the orthogonal
		// projection on the restricted simplex.
		function proxg(w) {
			return new Matrix_(simplexEuclidianProjection_(w.data, lowerBounds, upperBounds));
		}

		// Define the initial point as the projection of the 1 vector 
		// on the restricted unit simplex.
		var x0 = new Matrix_(simplexEuclidianProjection_(Matrix_.ones(nbAssets, 1).data, lowerBounds, upperBounds));

		// Solve the convex optimization problem
		var sol = ccpsolveFISTA_(f, gradf, g, proxg, x0, {eps: eps, maxIter: maxIterations, maxLine: maxIterations});
		
		// Return the solution, whose first element is the computed portfolio weights
		return sol;
	} 
	
	
	// ----
	
	
	// Define the weights of the portfolio
	var weights;
	
	
	// In case no cardinality constraints are imposed, the portfolio minimizing the 
	// tracking error is the solution of a convex program.
	//
	// In case cardinality constraints are imposed:
	// - Either an exhaustive enumeration of all the subsets of the set {1,...,nbAssets} 
	// of size between minNbAssets and maxNbAssets is done, searching for the feasible 
	// portfolio minimizing the tracking error over all these subsets - "combinatorialSearch" algorithm
	//
	// - Or a proven heuristic optimization algorithm is used in order to find a "best" approximation
	// of the optimal portfolio, c.f. the third reference - "heuristicSearch" algorithm
	if (!cardinalityConstraints) {
		// Extract the assets returns
		var assetsReturns = Matrix_.fill(nbPeriods, nbAssets, function(i,j) { return assetsReturns[j-1][i-1]; });
		
		// Compute the solution of the convex program associated to the
		// portfolio minimizing the tracking error.
		weights = computeMinimumTrackingErrorVolatilityPortfolio(assetsReturns, benchmarkReturns, 
																 lowerBounds, upperBounds)[0];		
	}
	else {
		if (optimizationMethod == 'thresholdAccepting') {
			// Extract the assets returns
			var assetsReturns = Matrix_.fill(nbPeriods, nbAssets, function(i,j) { return assetsReturns[j-1][i-1]; });
					
			// Define default lower and upper bounds constraints in case they are not provided
			if (!lowerBounds) {
				lowerBounds = typeof Float64Array === 'function' ? new Float64Array(nbAssets) : new Array(nbAssets);
				for (var i = 0; i < nbAssets; ++i) {
					lowerBounds[i] = 0;
				}
			}
			if (!upperBounds) {
				upperBounds = typeof Float64Array === 'function' ? new Float64Array(nbAssets) : new Array(nbAssets);
				for (var i = 0; i < nbAssets; ++i) {
					upperBounds[i] = 1;
				}
			}
			
			// Define the function representing the tracking error to minimize
			function f(w) {
				var w = new Matrix_(w);
				
				var te = Matrix_.xmy(Matrix_.xy(assetsReturns, w), benchmarkReturns).vectorNorm('two');
				
				return 0.5 * te * te;
			}

		    
			// Define the function which generates a feasible solution "close" to another
			// feasible solution, used by the threshold accepting algorithm.
			//
			// Adapted from Remarks on 'A comparison of some heuristic optimization methods'
			// http://enricoschumann.net/R/remarks.htm.
			function neighbourGenerator(x, neighbourGeneratorParameters) {		
				// Internal function to compute a random integer
				// C.f. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
				function randomIndex(min, max) { // 0, n --> 0, n-1
					return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
				}

				// Decode the input parameters
				var l = neighbourGeneratorParameters.lowerBounds;
				var u = neighbourGeneratorParameters.upperBounds;
		
				// The maximum default value of the position size to buy/sell
				var alpha = 5/100;
				
				// The numerical zero
				var eps = 1e-12;
				
				// Initialize the dimension
				var nbAssets = x.length;
				
				// For performances optimization reason, do not copy the current portfolio weights,
				// but alter it instead !
				var xx = x;
				
				// Compute the cardinality of the current portfolio weights
				var nbNonNullAssets = 0;
				for (var i = 0; i < nbAssets; ++i) {
					if (xx[i] > eps) {
						++nbNonNullAssets;
					}
				}
				
				// Determine the possible list of assets to buy
				//
				// - In case the number of non null assets is equal to the maximum
				// number of allowed assets:
				// -- An asset already present in the portfolio can always have its position
				// size increased (provided its upper bound is not reached) because this will not change
				// the number of non null assets present in the portfolio
				// -- An asset NOT already present in the portfolio can be added if 
				// another asset already present in the portfolio can be removed with the same position size
				// as the added asset
				//
				// - Otherwise, there is no specific restriction on the list of assets to buy
				var toBuyToSellIndexes = new Array(0);
				if (nbNonNullAssets == maxNbAssets) {
					// Case #1: Assets already present in the portfolio
					for (var i = 0; i < nbAssets; ++i) {
						if (xx[i] > eps && xx[i] < u[i] - eps) { // increasing the position size of asset i is feasible
							toBuyToSellIndexes.push([i, -1]);
						}
					}
					
					// Case #2: Assets NOT already present in the portfolio
					for (var i = 0; i < nbAssets; ++i) {
						// Determine possible assets j already present in the portfolio 
						// that can be swapped with asset i not already present in the portfolio.
						var toSellIndexes = new Array(0);
						if (xx[i] <= eps && xx[i] < u[i] - eps) { // asset i is not already in the portfolio and adding it to the portfolio is feasible
							// Compute the maximum potential position size to buy,
							// which is constrained by both the asset upper bound and
							// the asset lower bound
							var alphab = Math.max(l[i], Math.min(u[i] - xx[i], alpha));
							
							//
							for (var j = 0; j < nbAssets; ++j) {
								if (xx[j] > eps && (xx[j] - alphab <= eps)) { // asset j is already in the portfolio and its position size can be fully swapped with asset i
									toSellIndexes.push([j, xx[j]]);
								}
							}
						}
						
						// In case such possible assets j exist, it is feasible
						// to replace any one of them with asset i.
						if (toSellIndexes.length != 0) {
							toBuyToSellIndexes.push([i, toSellIndexes]);
						}
					}
				}
				else if (nbNonNullAssets < maxNbAssets) {
					for (var i = 0; i < nbAssets; ++i) {
						if (xx[i] < u[i] - eps) { // increasing the position size of asset i, or adding asset i is feasible
							toBuyToSellIndexes.push([i, -1]);
						}
					}
				}
				else {
					throw new Error('internal error: number of assets strictly greater than the allowed maximum number of assets');
				}
				
				// Generate a random asset to buy
				var toBuyToSell = toBuyToSellIndexes[randomIndex(0, toBuyToSellIndexes.length)];
				
				// 
				var toBuyIndex = toBuyToSell[0];

				// Compute the maximum position size that is possible to buy:
				// - In all cases, this position size is constrained by the asset upper bound
				// - Additionally, if the asset to buy is NOT already in the portfolio,
				// this position size must at minimum be equal to the asset lower bound
				alpha = Math.min(u[toBuyIndex] - xx[toBuyIndex], alpha);
				if (xx[toBuyIndex] <= eps) {
					alpha = Math.max(l[toBuyIndex], alpha);
				}
				
				// In case the possible assets to sell with their position quantity to sell
				// have not been determined yet, proceed with their determination.
				var toSellIndexes;
				if (toBuyToSell[1] == -1) {
					// Determine the possible list of assets to sell
					//
					// - In case the number of non null assets is equal to the minimum
					// number of allowed assets:
					// -- An asset already present in the portfolio can have its position size
					// reduced provided the resulting reduced position size will not force to sell the asset, 
					// because this will not change the number of non null assets present in the portfolio
					// (-- An asset already present in the portfolio whose size would reduced below its lower bound
					// but above 0 would not feasible, since this asset would then need to be fully sold, leaving cash
					// available after buying the asset to buy)
					//
					// - Otherwise, an asset already present in the portfolio can have its position size
					// reduced provided the resulting reduced position size will not result in having a position size
					// below its lower bound but above 0
					//
					toSellIndexes = new Array(0);
					if (nbNonNullAssets == minNbAssets) {
						for (var i = 0; i < nbAssets; ++i) {
							if (xx[i] > eps && xx[i] > eps + l[i]) { // decreasing the position size of asset i is feasible because the resulting weight will be > l[i], and so, will not force a full sell of the position
								// Compute the maximum position size that is possible to sell
								var alphas = Math.min(alpha, xx[i] - l[i] - 2*eps); // -2*eps is in order to prevent null positions in case there is no lower bound for the asset i, otherwise, the cardinality constraint would be violated
								
								// If the asset to buy is NOT already in the portfolio,
								// its minimum position size must be equal to its lower bound,
								// so that the position size of the asset to sell must be
								// sufficient.
								//
								// Otherwise, there is no additional constraint on the position size
								// if the asset to sell.
								if (xx[toBuyIndex] <= eps) {
									if (alphas >= l[toBuyIndex]) {
										toSellIndexes.push([i, alphas]);
									}
								}
								else {
									toSellIndexes.push([i, alphas]);
								}
								
							}
						}
					}
					else if (nbNonNullAssets > minNbAssets) {
						for (var i = 0; i < nbAssets; ++i) {
							if (xx[i] > eps && (xx[i] - alpha <= eps)) { // full sell of the asset i is feasible
								toSellIndexes.push([i, xx[i]]);
							}
							else if (xx[i] > eps && (xx[i] > eps + l[i])) { // decreasing the position size of asset i is feasible
								toSellIndexes.push([i, Math.min(alpha, xx[i] - l[i])]);
							}
						}
					}
					else {					
						throw new Error('internal error: number of assets strictly lower than the allowed minimum number of assets');
					}
				}
				else {
					// The possible list of assets to sell has already been determined
					toSellIndexes = toBuyToSell[1];
				}
				
				// Generate a random asset to sell
				var toSellIndex = toSellIndexes[randomIndex(0, toSellIndexes.length)];
					
				// Compute the maximum position size to sell,
				// which has already been done at asset selection time above.
				alpha = toSellIndex[1];
				
				// Update the current portfolio weights
				xx[toSellIndex[0]] -= alpha;			
				xx[toBuyIndex] += alpha;
				
				// Return the updated current portfolio weights
				return xx;
			}
			
			// Generate an initial feasible point for the threshold accepting algorithm
			var x0 = self.randomWeights(nbAssets, { constraints: {
											            minNbAssets: minNbAssets, maxNbAssets: maxNbAssets, 
											            minWeights: lowerBounds, maxWeights: upperBounds 
											        }
												  });
												  
			// Solve the NP-hard optimization problem with an heuristic optimization method,
			// proven in the third reference to be effective for index tracking problems.
			weights = thresholdAcceptingSolve_(f, x0,
											   {nSteps: nSteps, nRounds: nRounds, nDeltas: nDeltas,
											    neighbourGenerator: neighbourGenerator, 
												neighbourGeneratorParameters: { lowerBounds: lowerBounds, 
		                                                                        upperBounds: upperBounds }})[0];
			weights = new Matrix_(weights);
		}
		else if (optimizationMethod == 'combinatorial') {
			// Initialize the current minimum value of the tracking error
			// and the current list of associated assets/assets weights.
			var minTEValue = Infinity;
			var minTEAssetsIndexes = [];
			var minTEAssetsWeights = [];

			
			// Proceed to an exhaustive enumeration of all the subsets of the set {1,...,nbAssets}
			// satisfying the cardinality constraints in order to find 
			// the portfolio minimizing the tracking error over all these subsets.
			//
			// The feasibility of the enumerated subsets is guaranteed per their construction.
			for (var K = minNbAssets; K <= maxNbAssets; ++K) {
				var nextKSubsetIterator = new kSubsetsIterator_(nbAssets, K, false);
				var nextKSubset = nextKSubsetIterator.next();
				
				while (nextKSubset != -1) {
					// Extract the selected assets indexes
					var subsetNbAssets = nextKSubset.length;
					var subsetAssetsIdx = typeof UInt32Array === 'function' ? new UInt32Array(subsetNbAssets) : new Array(subsetNbAssets);
					for (var i = 0; i < nextKSubset.length; ++i) {
						subsetAssetsIdx[i] = nextKSubset[i];
					}

					// Extract the returns of the selected assets
					var subsetAssetsReturns = Matrix_.fill(nbPeriods, subsetNbAssets, 
														   function(i,j) { 
															   return assetsReturns[subsetAssetsIdx[j-1]-1][i-1]; 
														   });
					
					// Extract the lower and upper bounds constraints, if applicable
					var subsetLowerBounds;
					if (lowerBounds) {
						subsetLowerBounds = typeof Float64Array === 'function' ? new Float64Array(subsetNbAssets) : new Array(subsetNbAssets);
						for (var i = 0; i < subsetNbAssets; ++i) {
							subsetLowerBounds[i] = lowerBounds[subsetAssetsIdx[i]-1];
						}
					}
					var subsetUpperBounds;
					if (upperBounds) {
						subsetUpperBounds = typeof Float64Array === 'function' ? new Float64Array(subsetNbAssets) : new Array(subsetNbAssets);
						for (var i = 0; i < subsetNbAssets; ++i) {
							subsetUpperBounds[i] = upperBounds[subsetAssetsIdx[i]-1];
						}
					}
									
					// Compute the weights of the minimum tracking error portfolio for the selected assets
					//
					// Note: because the restricted simplex associated to the subset of selected assets
					// might be empty, special care must be taken.
					var subsetAssetsWeights;
					var subsetPortfolioTrackingError = Infinity;
					try {
						var subsetSol = computeMinimumTrackingErrorVolatilityPortfolio(subsetAssetsReturns, benchmarkReturns, 
																					   subsetLowerBounds, subsetUpperBounds);
																					   
						subsetAssetsWeights = subsetSol[0];
						subsetPortfolioTrackingError = subsetSol[1];
					}
					catch (e) {
						if (e.message !== "infeasible problem detected: the restricted simplex is empty") {
							throw(e);
						}
					}

					// If the tracking error of the current subset is lower than the current tracking error,
					// it becomes the new minimum tracking error and the current subset becomes the new 
					// list of selected assets.
					if (subsetPortfolioTrackingError < minTEValue) {
						minTEValue = subsetPortfolioTrackingError;
						minTEAssetsIndexes = subsetAssetsIdx;
						minTEAssetsWeights = subsetAssetsWeights;
					}
					// Otherwise, nothing needs to be done

					// Generate a new subset	
					var nextKSubset = nextKSubsetIterator.next();
				}
			}

			
			// Compute the original assets weights, in case a feasible minimum tracking error
			// portfolio has been found.
			if (minTEValue != Infinity) {
				weights = Matrix_.zeros(nbAssets, 1);
				for (var i = 0; i < minTEAssetsIndexes.length; ++i) {
					weights.data[minTEAssetsIndexes[i] - 1] = minTEAssetsWeights.data[i];
				}
			}
			else {
				throw new Error('infeasible problem detected');
			}
		}
		else {
			throw new Error('internal error: unsupported optimisation method');
		}
	}


	// Return the computed weights
	return weights.toArray();
}


/**
 * @file Functions related to most diversified portfolio.
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 


/**
* @function mostDiversifiedWeights
*
* @summary Compute the weights of the most diversified portfolio.
*
* @description This function returns the weights w_1,...,w_n associated to the fully invested and long-only
* most diversified portfolio of n assets, defined as the weights which maximizes the diversification ratio of the portfolio.
*
* This portfolio is unique, provided the covariance matrix of the assets is definite positive.
* 
* This portfolio maximizes the Sharpe ratio if the Sharpe ratio of each asset is the same.
*
* The algorithm used internally is a sequential minimization optimization algorithm,
* which is similar to a cyclical coordinate descent algorithm updating 2 coordinates at each iteration, 
* c.f. the fourth reference, and whose convergence is guaranteed as long as the covariance matrix
* is positive semi-definite
*
* In a previous version of the code, the algorithm used internally was a coordinate descent algorithm,
* c.f. the third reference, kept for historical reference.
*
* @see <a href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=1895459">Y. Choueifaty, T. Froidure, J. Reynier, Properties of the Most Diversified Portfolio, Journal of Investment Strategies, Vol.2(2), Spring 2013, pp.49-70.</a>
* @see <a href="https://ssrn.com/abstract=2595051">Richard, Jean-Charles and Roncalli, Thierry, Smart Beta: Managing Diversification of Minimum Variance Portfolios (March 2015)</a>
* @see <a href="https://link.springer.com/article/10.1023/A:1012431217818">Keerthi, S. & Gilbert, E. Convergence of a Generalized SMO Algorithm for SVM Classifier Design Machine Learning (2002) 46: 351.</a>
* 
* @param {Matrix_|Array.<Array.<number>>} sigma the covariance matrix (sigma_ij),i,j=1..n of the n assets in the considered universe, square Matrix or array of n array of n real numbers statisfying sigma[i-1][j-1] = sigma_ij.
* @param {object} opt the optional parameters for the algorithm.
* @param {number} opt.eps the tolerance parameter for the convergence of the algorithm, a strictly positive real number; defaults to 1e-04.
* @param {number} opt.maxIter the maximum number of iterations of the algorithm, a strictly positive natural integer; defaults to 10000.
* @return {Array.<number>} the weights corresponding to the most diversified portfolio, array of n real numbers.
*
* @example
* mostDiversifiedWeights([[0.0400, 0.0100], [0.0100, 0.0100]], {eps: 1e-10, maxIter: 10000});
* // [0.33, 0.67]
*/
self.mostDiversifiedWeights = function (sigma, opt) {
	// Decode options
	if (opt === undefined) {
		opt = {};
	}
	var eps = opt.eps || 1e-4;
	var maxIterations = opt.maxIter || 10000;
	
	// Convert sigma to matrix format
	var sigma = new Matrix_(sigma);
	
	// TODO: Checks, if enabled
	// Check that diagonal entries of sigma are strictly positive
	// Check that sigma is symmetric and positive definite
	// Check that sigma and rb are rows compatible


	// ------
	
	// Initializations
	var nbAssets = sigma.nbRows;
	var zeros = Matrix_.zeros(nbAssets, 1);
	var infinitys = Matrix_.fill(nbAssets, 1, function(i,j) { return Number.MAX_VALUE; });

	
	// ----
	
	// The long-only and fully invested most diversified portfolio can be recast
	// as the solution to a convex quadratic program (e.g., the associated matrix 
	// is positive semi-definite, since this is a covariance matrix), c.f. the first reference.
	
		// Build the matrix and the vector of the quadratic program
	var Q = sigma;
	var p = zeros;
	
		// Build the linear equality constraint in the recast space:
		// - Full investment when multiplied by the volatility
	var b = sigma.diagonal().elemMap(function(i,j,val) { return Math.sqrt(val); }); // volatilities
	var r = 1;
	
		// Build the bound constraints:
		// - All lower bounds are zero
		// - All upper bounds are infinite (i.e., no upper bound)
	var l = zeros;
	var u = infinitys;
	
		// Solve the quadratic program
	var sol = qpsolveGSMO_(Q, p, b, r, l, u, {eps: eps, maxIter: maxIterations});
	
	
	// ----
	
	// Extract the rescaled computed portfolio weights.
	var weights = sol[0].normalize();

	// Return the (rescaled) computed weights
	return weights.toArray();
}


/**
  * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 


/**
* @function numericalOptimizationWeights
*
* @summary Compute the weights of a portfolio minimizing an arbitrary objective function.
*
* @description This function returns the weights w_1,...,w_n associated to a fully invested and long-only portfolio
* of n assets minimizing an arbitrary real-valued objective function fct of n real variables defined on the unit simplex of R^n, 
* which is the n-1 dimensional set of R^n containing the points x = (x_1,...,x_n) statisfying sum x_i = 1 and x_i >= 0, i = 1..n, 
* c.f. the first reference.
*
* Optionally, the following constraints can be added:
* - Minimum weight of each asset that is included in the portfolio
* - Maximum weight of each asset that is included in the portfolio
*
* Since such a portfolio might not be unique, all the weights corresponding to the same minimum value of the function fct 
* are provided in output.
*
* The minimization of the function fct is achieved through one of the following numerical optimization methods:
* - Grid search on a grid of rational points belonging to the unit simplex of R^n
*
* To be noted that finding the minimum value(s) of an arbitrary real-valued objective function on the unit simplex
* is an NP-hard problem, c.f. the second reference, so that all exact optimization algorithms for this problem 
* are expected to be non-polynomial in n.
* 
* @see <a href="https://en.wikipedia.org/wiki/Simplex">Simplex</a>
* @see <a href="http://www.sciencedirect.com/science/article/pii/S0377221707004262">De Klerk, E., Den Hertog, D., Elabwabi, G.: On the complexity of optimization over the standard simplex. Eur. J Oper. Res. 191, 773–785 (2008)</a>
* @see <a href="https://ideas.repec.org/p/cor/louvco/2003071.html">Nesterov, Yurii. Random walk in a simplex and quadratic optimization over convex polytopes. CORE Discussion Papers ; 2003/71 (2003)</a>
*
* @param {number} nbAssets the number of assets in the considered universe, natural integer superior or equal to 1.
* @param {function} fct a real-valued objective function of n real variables to minimize on the unit simplex of R^n,
* which must take as first input argument an array of n real numbers corresponding to the weights w1,...,wn of the n assets 
* in the considered universe and which must return as output a real number.
* @param {Object} opt parameters for the numerical optimization algorithm.
* @param {Array.<number>} opt.constraints.minWeights an optional array of size n (l_i),i=1..n containing the minimum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of zeros.
* @param {Array.<number>} opt.constraints.maxWeights an optional array of size n (u_i),i=1..n containing the maximum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of ones.
* @param {string} opt.optimizationMethod the optimization method to use in order to minimize the function fct, a string either equals to:
* - 'grid-search': usage of a grid search algorithm on the k-th rational grid of the unit simplex of R^n, 1/k * I_n(k), c.f. the third reference, where k is defined through the parameter opt.optimizationMethodParams.k
; defaults to 'grid-search'.
* @param {number} opt.optimizationMethodParams.k the indice k of the k-th rational grid of the unit simplex of R^n to use in case opt.optimizationMethod is equal to 'grid-search', a natural integer greater than or equal to 1; defaults to n.
* @return {Array.<Array.<number>>} an array of possibly several arrays of n real numbers, each array of n real numbers corresponding to
* the weights of a portfolio minimizing the function fct.
*
* @example
* numericalOptimizationWeights(3, function(arr) { return arr[0];}, {optimizationMethodParams: {k: 2}});
* // [[0,1,0],[0,0.5,0.5],[0,0,1]]
*/
self.numericalOptimizationWeights = function (nbAssets, fct, opt) {
	// Initialize the options structure
	if (opt === undefined) {
		opt = {};
	}
	if (opt.constraints === undefined) {
		opt.constraints = {};
	}
	if (opt.optimizationMethodParams === undefined) {
		opt.optimizationMethodParams = {};
	}

	// Initialize the options default values
	var optimizationMethod = opt.optimizationMethod;
	if (optimizationMethod === undefined) {
		optimizationMethod = 'grid-search';
	}
	if (optimizationMethod === 'grid-search') {
		if (opt.optimizationMethodParams.k === undefined) {
			opt.optimizationMethodParams.k = nbAssets;
		}
	}
	
	// Select the proper optimisation method
	if (optimizationMethod === 'grid-search') {
		// Call the rational grid search method
		return simplexGridSearch_(fct, nbAssets, opt.optimizationMethodParams.k, opt.constraints.minWeights, opt.constraints.maxWeights);
	}
	else {
	    throw new Error('unsupported optimisation method');
	}
}



/**
* @author Roman Rubsamen <roman.rubsamen@gmail.com>
*/




/**
* @function postOptimizationWeights
*
* @summary Compute investable (integer, rational) portfolio weights from numerical (floating point) portfolio weights. 
*
* @description Given n (floating point) weights w_1,...,w_n associated to a fully invested and long-only portfolio of n assets, 
this function either:
* - If opt.roundingMethod equals to "rationalizing", computes n (rational) weights wr_1,...,wr_n associated to a fully invested 
* and long-only portfolio of n assets satisfying:
* -- opt.roundingMethodParams.k * wr_i is a natural integer, i=1..n
* -- wr_1,...,wr_n are the closest weights to w_1,...,w_n, in the sense defined in the first reference
*
*   Note: Typical values of opt.roundingMethodParams.k are 10 (rounding to 10%), 20 (rounding to 5%) and 100 (rounding to 1%).
*
*
* - If opt.roundingMethod equals to "roundlotting", computes n integer weights wi_1,...,wi_n associated to a fully invested 
* and long-only portfolio of total value opt.roundingMethodParams.portfolioValue, composed of n assets with prices 
* opt.roundingMethodParams.assetsPrices and which must be bought by multiples of opt.roundingMethodParams.sizeLots quantities, satisfying
* wi_j * opt.roundingMethodParams.assetsPrices[j-1] * opt.roundingMethodParams.sizeLots[j-1], j=1..n is the quantity of asset j which must be possessed
* so that the proportion of the total value of asset j in the portfolio is close to the numerical weight w_j in the sense defined in the third reference.
*
*   Note: Due to the integer-valued nature of the underlying optimization problem, computing an optimal round lot solution is an NP-hard problem,
*   c.f. the third and fifth references, so that the heuristic optimization algorithm described in the fourth reference, called "Threshold Accepting", is used.
*         While the Threshold Accepting algorithm is not guaranteed to provide an optimal solution, it is reasonably guaranteed to provide a "good enough" solution.
*         One caveat though, because the Threshold Accepting algorithm is stochastic, different executions of this algorithm might return different weights.
*
* @see <a href="https://doi.org/10.1007/s10898-013-0126-2">M. Bomze, S. Gollowitzer, and E.A. Yıldırım, Rounding on the standard simplex: Regular grids for global optimization, J. Global Optim. 59 (2014), pp. 243–258.</a>
* @see <a href="https://www.msci.com/documents/10199/b166dc05-b842-48fe-812d-3e310756c21c">Rong Xu and Scott Liu, Managing Odd Lot Trades with the Barra Optimizer, Research Insight, September 2013</a>
* @see <a href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2261131">Steiner, Andreas, Accuracy and Rounding in Portfolio Construction (April 30, 2013)</a>
* @see <a href="https://link.springer.com/article/10.1007/s10732-010-9138-y">Gilli, M., Schumann, E. Optimal enough?. J Heuristics 17, 373–387 (2011).</a>
* @see <a href="https://pubsonline.informs.org/doi/abs/10.1287/ijoc.7.1.109">Kurt M. Bretthauer, Bala Shetty, Siddhartha Syam, (1995) A Branch and Bound Algorithm for Integer Quadratic Knapsack Problems. ORSA Journal on Computing 7(1):109-116.</a>
* 
* @param {Array.<number>} originalWeights the weights w_1,...,w_n associated to a fully invested and long-only portfolio of n assets, array of n real numbers.
* @param {object} opt optional parameters for the algorithm.
* @param {string} opt.roundingMethod the rounding method to use in order to compute the investable portfolio weights, a string either equals to:
* - 'rationalizing': usage of the rational rounding method described in the first reference
* - 'roundlotting': usage of the round lot optimization method described in the third reference, using the "Threshold Accepting" heuristic described 
* in the fourth reference to approximately compute "good enough" investable portfolio weights; parameters opt.roundingMethod.portfolioValue and 
* opt.roundingMethod.assetsPrices are mandatory in this case
; defaults to 'rationalizing'.
* @param {number} opt.roundingMethodParams.k the value to which the rounded weights will be a multiple of the inverse in case opt.roundingMethod is equal to "rationalizing",
* natural integer greater than or equal to 1; defaults to 20.
* @param {number} opt.roundingMethodParams.portfolioValue the total value of the portfolio whose numerical weights w_1,...,w_n are provided in case opt.roundingMethod is equal to "roundlotting"
* @param {Array.<number>} opt.roundingMethodParams.assetsPrices the prices of the n assets whose numerical weights w_1,...,w_n are provided in case opt.roundingMethod is equal to "roundlotting"
* @param {Array.<number>} opt.roundingMethodParams.sizeLots the size of the lots to buy for the n assets whose numerical weights w_1,...,w_n are provided in case opt.roundingMethod is equal to 
* "roundlotting"; defaults to an array of ones (i.e., minimal quantity to buy for all the assets is 1)
*
* @return {Array.<number>} in case opt.roundingMethod is equal to "rationalizing", the rational rounded weights wr_1,...,wr_n, array of n real numbers.
* @return {Array.<Array.<number>, Array.<number>, number>} in case opt.roundingMethod is equal to "roundlotting":
* - the integer weights wi_1,...,wi_n, array of n integers
* - the rational weights wrr_1,...,wrr_n corresponding to the integer weights wi_1,...,wi_n, array of n real numbers, computed with 
* wrr_j = wi_j * opt.roundingMethodParams.assetsPrices[j-1] * opt.roundingMethodParams.sizeLots[j-1] / opt.roundingMethodParams.portfolioValue, j=1..n
* - the quantity of remaining cash in the portfolio, a positive real number
*
* @example
* postOptimizationWeights([0.5759, 0.0671, 0.3570], {roundingMethodParams: 10});
* // [0.6, 0.1, 0.3]
* postOptimizationWeights([0.5759, 0.0671, 0.3570], {roundingMethodParams: 20});
* // [0.6, 0.05, 0.35]
* postOptimizationWeights([0.5759, 0.0671, 0.3570], {roundingMethodParams: 100});
* // [0.57, 0.07, 0.36]
*/
self.postOptimizationWeights = function (originalWeights, opt) {
	// Initialize the options structure
	if (opt === undefined) {
		opt = { roundingMethodParams: {}, 
		        roundingOptimizationMethodParams: {} };
	}
	if (opt.roundingOptimizationMethodParams === undefined) {
		opt.roundingOptimizationMethodParams = {};
	}
	if (opt.roundingMethodParams === undefined) {
		opt.roundingMethodParams = {};
	}
	
	// Initialize the options default values
	if (opt.roundingMethod === undefined) {
		opt.roundingMethod = "rationalizing";
	}
	if (opt.roundingMethod == "rationalizing" && opt.roundingMethodParams.k == undefined) {
		opt.roundingMethodParams.k = 20;
	}
	
	// Decode the options
	var roundingMethod = opt.roundingMethod;
	if (roundingMethod != 'rationalizing' && roundingMethod != 'roundlotting') {
		throw new Error('unsupported rounding method');
	}
	
	// In case of rationalizing rounding method
	var k;
	if (roundingMethod == "rationalizing") {
		k = opt.roundingMethodParams.k;
	}

	// In case of roundlotting rounding method:
	// - Initialize the current portfolio value, as well as the current
	// assets prices and associated minimum rount lots, adding an additional
	// cash as last asset.
	//
	// - Initialize the default parameters for the Threshold Accepting
	// heuristic.
	var portfolioValue = opt.roundingMethodParams.portfolioValue;
	var assetsPrices = opt.roundingMethodParams.assetsPrices;
	var sizeLots = opt.roundingMethodParams.sizeLots;
	if (roundingMethod == 'roundlotting') {
		if (portfolioValue == undefined || portfolioValue == 0) {
			throw new Error('missing portfolio value');
		}
		if (assetsPrices == undefined) {
			throw new Error('missing assets prices');
		}
		if (sizeLots === undefined) {
			sizeLots = typeof Float64Array === 'function' ? new Float64Array(originalWeights.length) : new Array(originalWeights.length);		
			for (var i = 0; i < sizeLots.length; ++i) {
				sizeLots[i] = 1;
			}
		}
	}
	
	var nRounds;
	var nSteps;
	var nDeltas;
	if (roundingMethod == 'roundlotting') {
		nRounds = opt.roundingOptimizationMethodParams.nRounds;
		if (nRounds === undefined) {
			nRounds = 3;
		}
		
		nSteps = opt.roundingOptimizationMethodParams.nSteps;
		if (nSteps === undefined) {
			nSteps = 5000;
		}

		nDeltas = opt.roundingOptimizationMethodParams.nDeltas;
		if (nDeltas === undefined) {
			nDeltas = nSteps;
		}
	}
	
	
	// ------
	
	//
	if (roundingMethod == "rationalizing") {
		// Call to the simplex rational rounding method
		var roundedWeights = simplexRationalRounding_(originalWeights, k);
		
		// Return the computed weights
		return roundedWeights;
	}
	else if  (roundingMethod == "roundlotting") {
		// The numerical zero
		var eps = 1e-12;
				
		// Initialize the dimension
		var nbAssets = originalWeights.length;

		// Convert the original weights to matrix format,
		// adding a cash position as an additional last asset.
		var originalWeights = new Matrix_.fill(nbAssets + 1, 1, function(i,j) { if (i <= nbAssets) { return originalWeights[i-1]; } else { return 0;} });
		
		// Define the function representing the weights RMSE error to minimize,
		// taking in input q = [q_1,...q_nbAssets, q_cash], the quantity of lots associated
		// to each asset, with q_cash being the quantity of cash of the portfolio.
		function f(q) {
			//
			var w = new Matrix_.fill(nbAssets + 1, 1, 
			                         function(i,j) { 
									    if (i <= nbAssets) { // true asset
											return q[i-1] * sizeLots[i-1] * assetsPrices[i-1] / portfolioValue;
										}
                                        else { // cash
											return q[nbAssets] / portfolioValue;
									    }
									  });

			// Note that the value below is not exactly the RMSE, but the RMSE up
			// to a constant.
			var rmse = Matrix_.xmy(originalWeights, w).vectorNorm('two');
			
			//
			return rmse;
		}
	
		// Define the function which generates a feasible solution "close" to another
		// feasible solution, used by the threshold accepting algorithm.
		//
		// The input q represents q = [q_1,...q_nbAssets, q_cash], the quantity of lots associated
		// to each asset, with q_cash being the quantity of cash of the portfolio.
		function neighbourGenerator(q, neighbourGeneratorParameters) {					
			// Internal function to compute a random integer
			// C.f. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
			function randomIndex(min, max) { // 0, n --> 0, n-1
				return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
			}
			
			// Determine the assets which can be sold (excluding cash)
			var nbSellableAssets = 0;
			for (var i = 0; i < nbAssets; ++i) {
				if (q[i] > 0) {
					++nbSellableAssets;
				}
			}
			var sellableAssets = typeof UInt32Array === 'function' ? new UInt32Array(nbSellableAssets) : new Array(nbSellableAssets);
			for (var i = 0, j = 0; i < nbAssets; ++i) {
				if (q[i] > 0) {
					sellableAssets[j] = i;
					++j;
				}
			}
			
			// If the portfolio is not 100% in cash, sell a random number of lots of a random asset
			if (sellableAssets.length != 0) {
				// Determine a random asset to sell
				var toSellIndex = sellableAssets[randomIndex(0, nbSellableAssets)];

				// Determine a random number of lots of the selected asset to sell (minimum 1, maximum full quantity)
				var toSellNbLots = randomIndex(1, q[toSellIndex] + 1);
				
				// Sell them
				q[toSellIndex] -= toSellNbLots;
				var cashAddition = assetsPrices[toSellIndex] * sizeLots[toSellIndex] * toSellNbLots;
				q[nbAssets] += cashAddition;
			}
			
			// Determine the assets which can be bought (i.e., these with non null original weights), including cash
			var nbBuyableAssets = 1; // cash
			for (var i = 0; i < nbAssets; ++i) {
				if (originalWeights.getValue(i + 1, 1) > eps) {
					++nbBuyableAssets;
				}
			}
			var buyableAssets = typeof UInt32Array === 'function' ? new UInt32Array(nbBuyableAssets) : new Array(nbBuyableAssets);
			for (var i = 0, j = 0; i < nbAssets; ++i) {
				if (originalWeights.getValue(i + 1, 1) > eps) {
					buyableAssets[j] = i;
					++j;
				}
			}
			buyableAssets[nbBuyableAssets - 1] = nbAssets;
			
			
			// Determine a random asset to buy
			var toBuyIndex = buyableAssets[randomIndex(0, nbBuyableAssets)];
			
			// If the selected asset to buy is not cash, buy a random number of lots of the selected asset
			if (toBuyIndex != nbAssets) {
				// Determine the maximum number of lots of the selected asset to buy
				var toBuyMaxNbLots = Math.floor( q[nbAssets] / (assetsPrices[toBuyIndex] * sizeLots[toBuyIndex]) );
				
				// Determine a random number of lots of the selected asset to buy (minimum 0 if not enough cash, maximum maximum quantity above)
				var toBuyNbLots = randomIndex(0, toBuyMaxNbLots + 1);

				// Buy them
				q[toBuyIndex] += toBuyNbLots;
				var cashRemoval = assetsPrices[toBuyIndex] * sizeLots[toBuyIndex] * toBuyNbLots;
				q[nbAssets] -= cashRemoval;
			}	

			// Return the updated current portfolio lots
			return q;
		}
		
		// Generate an initial feasible point for the threshold accepting algorithm,
		// c.f. "Implementing a Target Allocation" section of the third reference.
		//
		// The procedure belows guarantees that the cash is always in excess.
		var q0 = typeof Float64Array === 'function' ? new Float64Array(nbAssets + 1) : new Array(nbAssets + 1);
		var val = 0;
		for (var i = 0; i < nbAssets; ++i) {
			var lotPrice = assetsPrices[i] * sizeLots[i];
			q0[i] = Math.floor( originalWeights.getValue(i + 1, 1) * portfolioValue / lotPrice );

			val += q0[i] * lotPrice;
		}
		var cash = portfolioValue - val;
		if (cash < 0) {
			throw new Error('internal error: negative cash during intitial feasible point generation');
		}
		q0[nbAssets] = cash;

		// Now, in addition of having an initial feasible solution, iterate over all 
		// the assets i for which buying an additional lot is both feasible (i.e., enough cash)
		// and helps decreasing the value of the objective function.
		//
		// If several such assets are found, buy the asset which helps decreases the
		// objection function the most.
		//
		// Otherwise, stops the process.
		//
		// This procedure is similar in spirit to the heuristic described in the section 
		// "Feasible Integer Solution Heuristic" of the fifth reference, except that
		// the chosen iteration order is not dependent of the assets indexes.
		while (true) {
			var assetIdx = -1;
			var fMin = f(q0);
			for (var i = 0; i < nbAssets; ++i) {
				var lotPrice = assetsPrices[i] * sizeLots[i];
				
				// Buying an additional lot of asset i is feasible
				if (lotPrice < cash) {
					// Update the initial feasible solution with a potential update
					// to compute the change in the objective function value.
					q0[i] += 1;
					q0[nbAssets] = cash - lotPrice;
					
					var fNew = f(q0);
					if (fNew <= fMin) {
						assetIdx = i;
						fMin = fNew;
					}
					
					// Undo the update above
					q0[i] -= 1;
					q0[nbAssets] = cash;
				}
			}
			 
			// In case improving the initial feasible solution is not possible anymore,
			// stops the process.
			if (assetIdx == -1) {
				break;
			}
			
			// Buy one additional lot of the determined asset
			q0[assetIdx] += 1;
			cash -= assetsPrices[assetIdx] * sizeLots[assetIdx];
		}
		
		// The best initial feasible solution has been found
		if (cash < 0) {
			throw new Error('internal error: negative cash during intitial feasible point generation');
		}
		q0[nbAssets] = cash;

		// Solve the NP-hard optimization problem with an heuristic optimization method,
		// proven in the fourth reference to be effective for index tracking problems.
		var q = thresholdAcceptingSolve_(f, q0,
					  					 {nSteps: nSteps, nRounds: nRounds, nDeltas: nDeltas,
										  neighbourGenerator: neighbourGenerator})[0];

		// Format the computed weights
		var roundedWeights = new Matrix_.fill(nbAssets, 1, function(i,j) { return q[i-1] * sizeLots[i-1] * assetsPrices[i-1] / portfolioValue; }).toArray();
		var qLots = new Matrix_.fill(nbAssets, 1, function(i,j) { return q[i-1]; }).toArray();
		var cash = q[nbAssets];
		
		// Return the formatted computed weights
		return [qLots, roundedWeights, cash];
	}
	else {
		throw new Error('internal error: unsupported rounding method');
	}
}
/**
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 


/**
* @function proportionalMinimumVarianceWeights
*
* @summary Compute the weights of the proportional minimum variance (heuristic) portfolio.
*
* @description This function returns the weights w_1,...,w_n associated to the fully invested and long-only 
* proportional minimum variance (heuristic) portfolio of n assets, as computed by the minimum variance algorithm of the reference.
*
* This portfolio is unique.
* 
* This portfolio is meant to approximate the global minimum variance (GMV) portfolio.
*
* The algorithm used is the minimum variance algorithm (MVA), with primary benefits versus the conventional optimization methods:
* - speed of computation and ease of calculation 
* - greater robustness to estimation error
* - superior risk dispersion
*
* @see <a href="https://cssanalytics.wordpress.com/2013/04/05/minimum-variance-algorithm-mva-excel-sheet/">Minimum Variance Algorithm (MVA) Excel Sheet</a>
*
* @param {Matrix_|Array.<Array.<number>>} sigma the covariance matrix (sigma_ij),i,j=1..n of the n assets in the considered universe, square Matrix or array of n array of n real numbers statisfying sigma[i-1][j-1] = sigma_ij.
* @param {object} opt the optional parameters for the algorithm, unused.
* @return {Array.<number>} the weights corresponding to theminimum variance (heuristic) portfolio, array of n real numbers.
*
* @example
* proportionalMinimumVarianceWeights([[0.1, 0], [0, 0.2]]);
* // ~[0.86, 0.14] 
*/
self.proportionalMinimumVarianceWeights = function (sigma, opt) {
	// Convert sigma to matrix format
	var sigma = new Matrix_(sigma);
	
	// TODO: Checks, if enabled	
	
	// ------
	var nbAssets = sigma.nbRows;
	
	// Step 1: Average pairwise covariance, and associated mean/standard deviation
	var rowsElements = sigma.toRowArray();
	var rowsAverages = new Array(nbAssets);
	for (var i = 0; i < nbAssets; ++i) {
		rowsAverages[i] = mean_(rowsElements[i]);
	}
	var elementsMean = mean_(rowsAverages);
	var elementsStddev = sampleStddev_(rowsAverages);

	// Step 2: Gaussian conversion, and proportional average covar weigth
	var weights = new Matrix_(rowsAverages, 1).elemMap(function(i, j, val) { 
		return 1 - normcdf_((val - elementsMean)/elementsStddev);
	});
	weights = weights.normalize(weights);
	
	// Step 3: Scale portfolio weights by assets variances
	var invVariancesWeights = sigma.diagonal().elemMap(function(i,j,val) { return 1/val; }).normalize();
	weights = Matrix_.vectorHadamardProduct(weights, invVariancesWeights).normalize();
	
	// Return the computed weights
	return weights.toArray();
}


/**
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 



/**
* @function randomSubspaceOptimizationWeights
*
* @summary Compute the weights of a portfolio using the random subspace optimization method 
* applied to an arbitrary portfolio optimization algorithm.
*
* @description This function returns the weights w_1,...,w_n associated to a long-only fully or partially 
* invested portfolio of n assets, as computed by the random subspace optimization method described informally 
* in the first reference and more formally in the second and third references (in the specific case of 
* the mean-variance portfolio optimization algorithm).
*
* Optionally, the following constraints can be added:
* - Minimum weight of each asset that is included in the portfolio
* - Maximum weight of each asset that is included in the portfolio
*
* This algorithm combines the usage of a random subspace optimization method with an arbitrary portfolio
* optimization algorithm the following way:
* - If subsetsGenerationMethod is equal to 'random', repeat nbRandomSubsets times:
* -- Generate uniformly at random a subset of sizeSubsets assets from the n assets 
* -- Using an arbitrary portfolio optimization algorithm over the generated subset of assets,
* compute the weights associated to an optimal portfolio
*
* - Else if subsetsGenerationMethod is equal to 'deterministic', repeat Binomial(nbAssets, sizeSubsets) times:
* -- Generate a subset of sizeSubsets assets from the n assets, without replacement
* -- Using an arbitrary portfolio optimization algorithm over the generated subset of assets,
* compute the weights associated to an optimal portfolio
*
* Note: in both cases, it can happen that the portfolio optimization algorithm is not able to
* compute an optimal portfolio over some generated subsets of assets, for instance because
* there is no feasible portfolio over these subsets of assets. The parameter maxInfeasibleSubsetsRatio
* allows to define a maximum allowed proportion of such infeasible subsets over the total number of generated subsets,
* beyond which the random subspace optimization method is aborted.
*
* - In both cases, compute the weights of a final portfolio as 
* either the arithmetic average of all the previously computed portfolios weights
* (if subsetsAggregationMethod is equal to 'average'), which is ex-ante optimal 
* c.f. the third reference, or as the geometric median of all the previously computed 
* portfolios weights (if subsetsAggregationMethod is equal to 'median'), which is more robust to
* a bad luck of the draw than the average.
*
* Note: The algorithm used internally for the uniform selection at random is the method D
* of J.S. Vitter, c.f. the sixth reference.
*
* @see <a href="https://cssanalytics.wordpress.com/2013/10/10/rso-mvo-vs-standard-mvo-backtest-comparison/">RSO MVO vs Standard MVO Backtest Comparison, OCTOBER 10, 2013</a>
* @see <a href="https://aaai.org/ocs/index.php/AAAI/AAAI17/paper/view/14443">SHEN, W.; WANG, J.. Portfolio Selection via Subset Resampling. AAAI Conference on Artificial Intelligence, North America, feb. 2017.</a>
* @see <a href="http://www.hss.caltech.edu/content/subset-optimization-asset-allocation">Benjamin J. Gillen, Subset Optimization for Asset Allocation, SOCIAL SCIENCE WORKING PAPER 1421, June 1, 2016</a>
* @see <a href="https://doi.org/10.1007/978-3-642-31537-4_13">Oshiro T.M., Perez P.S., Baranauskas J.A. (2012) How Many Trees in a Random Forest?. In: Perner P. (eds) Machine Learning and Data Mining in Pattern Recognition. MLDM 2012. Lecture Notes in Computer Science, vol 7376. Springer, Berlin, Heidelberg</a>
* @see <a href="https://www.stat.berkeley.edu/~breiman/Using_random_forests_V3.1.pdf">Breiman, L (2002), Manual On Setting Up, Using, And Understanding Random Forests V3.1</a>
* @see J.S. Vitter. An efficient algorithm for sequential random sampling. RR-0624, INRIA. 1987. <inria-00075929>
*
* @param {number} nbAssets the number of assets in the considered universe, natural integer superior or equal to 1.
* @param {function} subsetOptimizationFct, a function representing a portfolio optimization method to apply on each generated subset of assets, which must take:
* - As a first input argument, an array subsetAssetsIdx of sizeSubsets different integers belonging to [1..nbAssets], 
* in increasing order, representing the indexes of the original assets belonging to the generated subset of assets
* - As a second input argument, a JavaScript object subsetOptimizationFctOpt, representing optional parameters
* to be provided to the function subsetOptimizationFct, with subsetOptimizationFctOpt.constraints.minWeights and 
* subsetOptimizationFctOpt.constraints.maxWeights automatically computed from
* opt.constraints.minWeights and opt.constraints.maxWeights if provided
* and which must return an array of sizeSubsets real numbers belonging to the unit simplex of R^sizeSubsets, representing
* the weights w_1,...,w_sizeSubsets of the portfolio computed by the portfolio optimization method applied to the generated 
* subset of assets. In case these weights cannot be computed, the funtion subsetOptimizationFct is expected to throw an instance of
* the JavaScript Error class with the exact error message "infeasible portfolio optimization problem".
* @param {object} opt optional parameters for the random subspace optimization method.
* @param {number} opt.sizeSubsets the number of assets to include in the generated subsets of assets, a positive natural integer satisfying 2 <= sizeSubsets < n; 
* defaults to the floored value of SQRT(nbAssets).
* @param {string} opt.subsetsGenerationMethod the method used to generate the subset of assets, a string either equal to:
* - 'random' in order to generate the subsets of assets uniformly at random
* - 'deterministic' in order to generate the subsets of assets deterministically, through the enumeration of all the Binomial(nbAssets, sizeSubsets) subsets of assets
*; defaults to 'random'
* @param {number} opt.nbRandomSubsets the number of subsets of assets to generate in case opt.subsetsGenerationMethod is set to 'random', a strictly positive natural integer; defaults to 128.
* @param {number} opt.maxInfeasibleSubsetsRatio the maximum allowed proportion of infeasible subsets of assets over all the generated subsets of assets,
* a positive real number satisfying 0 <= maxInfeasibleSubsetsRatio < 1; defaults to 0.
* @param {string} opt.subsetsAggregationMethod the method used to compute the final portfolio weights from all the generated portfolios weights,
* a string equal to:
* - 'average' in order to compute the final portfolio weights as the arithmetic average of all the computed portfolios weights
* - 'median' in order to compute the final portfolio weights as the geometric median of all the computed portfolios weights
; defaults to 'average'.
* @param {object} opt.subsetOptimizationFctOpt optional parameters to be provided as is to the portfolio optimization method represented by the function subsetOptimizationFct, a JavaScript object 
* @param {Array.<number>} opt.constraints.minWeights an optional array of size n (l_i),i=1..n containing the minimum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of zeros.
* @param {Array.<number>} opt.constraints.maxWeights an optional array of size n (u_i),i=1..n containing the maximum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of ones.
* @return {Array.<number>} the weights corresponding to the computed portfolio, array of n real numbers.
*
* @example
* randomSubspaceOptimizationWeights(3,
									function subsetOptimizationFct(subsetAssetsIdx, subsetOptimizationFctOpt) {
										// Return a constant value, independently of the selected assets
										return [0, 1];
									},
									{sizeSubsets: 2})
*/
self.randomSubspaceOptimizationWeights = function(nbAssets, subsetOptimizationFct, opt) {			
	// Initialize the options structure
	if (opt === undefined) {
		opt = {};
	}
	if (opt.constraints === undefined) {
		opt.constraints = {};
	}
	if (opt.subsetOptimizationFctOpt === undefined) {
		opt.subsetOptimizationFctOpt = {};
	}
	if (opt.subsetOptimizationFctOpt.constraints === undefined) {
		opt.subsetOptimizationFctOpt.constraints = {};
	}

	// ------
	
	// Limit cases: 
	// - If the number of assets is lower than or equal to 1, return immediately
	if (nbAssets <= 1) {
		return [1];
	}
	
	
	// ------	
	
	// Decode options

	// The default size of the subsets to generate is obtained following 
	// the fifth reference, i.e., the square root of the number of assets.
	var sizeSubsets = opt.sizeSubsets;
	if (sizeSubsets === undefined) {
		sizeSubsets = Math.max(2, Math.floor(Math.sqrt(nbAssets)));
	}
	if (sizeSubsets <= 1 || sizeSubsets >= nbAssets + 1) {
		throw new Error('the size of the subsets of assets must be between 2 and ' + nbAssets.toString());
	}

	
	// The subsets optimization method is equal to the function subsetOptimizationFct

	// The default method of subsets generation is uniform at random 
	var subsetsGenerationMethod = opt.subsetsGenerationMethod;
	if (subsetsGenerationMethod === undefined) {
		subsetsGenerationMethod = 'random';
	}
	
	// The default number of random subsets to generate is 128,
	// c.f. the fourth reference.
	//
	// Limit cases:
	// - If the size of the subsets to generate is equal to the number of assets,
	// there would be nbSubsets identical computations made in the core process below,
	// to which their average/median would also be identical.
	//
	// Thus, this case is explicitly managed for performances reasons.
	var nbRandomSubsets = opt.nbRandomSubsets;
	if (nbRandomSubsets === undefined) {
		nbRandomSubsets = 128;		
	}
	if (sizeSubsets === nbAssets) {
		nbRandomSubsets = 1;
	}

	
	// The default number of subsets to generate depends on the method of
	// subsets generation.
	var nbSubsets;
	if (subsetsGenerationMethod === 'random') {
		nbSubsets = nbRandomSubsets;
	}
	else if (subsetsGenerationMethod === 'deterministic') {
		nbSubsets = binomial_(nbAssets, sizeSubsets);
	}
	else {
		throw new Error('unsupported subsets of assets generation method');
	}
	
	// The default method of aggregation of the random portfolios into the
	// final portfolio.
	var subsetsAggregationMethod = opt.subsetsAggregationMethod;
	if (subsetsAggregationMethod === undefined) {
		subsetsAggregationMethod =  'average';
	}
	if (subsetsAggregationMethod !== 'average' && 
	    subsetsAggregationMethod !== 'median') {
		throw new Error('unsupported aggregation method');
	}
	
	// The default proportion of allowed infeasible generated portfolios over 
	// all the generated portfolios is zero.
	var maxInfeasibleSubsetsRatio = opt.maxInfeasibleSubsetsRatio;
	if (maxInfeasibleSubsetsRatio === undefined) {
		maxInfeasibleSubsetsRatio =  0;
	}

	
	// ------
	
	
	// Core process
	
	// Initializations
	// The assets subsets generator
	var subsetAssetsIdxIterator; 
	if (subsetsGenerationMethod === 'random') {
		subsetAssetsIdxIterator = new randomKSubsetsIterator_(nbAssets, sizeSubsets, false); // use no array copy in the subsets generation to improve performances
	}
	else if (subsetsGenerationMethod === 'deterministic') {
		subsetAssetsIdxIterator = new kSubsetsIterator_(nbAssets, sizeSubsets, false); // use no array copy in the subsets generation to improve performances
	}
	else {
		throw new Error('unsupported subsets generation method');
	}
	
	// The options to provide to the portfolio optimization algorithm used
	// to compute the weights associated to the selected assets.
	var subsetOptimizationFctOpt = opt.subsetOptimizationFctOpt;

    // The number of generated feasible portfolios
	var nbFeasibleGeneratedPortfolios = 0;

	// The storage space for the generated portfolios weights
	var generatedPortfoliosWeights = new Array(nbSubsets); 

	// The storage space for the optional subsets minWeights and maxWeights constraints.
	if (opt.constraints.minWeights) {
		subsetOptimizationFctOpt.constraints.minWeights = typeof Float64Array === 'function' ? new Float64Array(sizeSubsets) : new Array(sizeSubsets);
	}
	if (opt.constraints.maxWeights) {
		subsetOptimizationFctOpt.constraints.maxWeights = typeof Float64Array === 'function' ? new Float64Array(sizeSubsets) : new Array(sizeSubsets);
	}
	
	// Generation of the nbSubsets portfolios weights
	for (var k = 0; k < nbSubsets; ++k) {
		// Select either uniformly at random or deterministically sizeSubsets assets
		// from the nbAssets assets.
		//
		// Note: the ex-ante optimality of the final portfolio (if the aggregation mode is
		// 'average') relies on the fact that the subsets of assets are generated uniformly,
		// c.f. the third reference.
		//
		// The "uniformness" of the random algorithm used is then very important.
		var subsetAssetsIdx = subsetAssetsIdxIterator.next();
		
		// In case minimum/maximum weights constraints are provided, automatically map
		// these constraints to the selected assets.
		if (opt.constraints.minWeights) {
			for (var i = 0; i < sizeSubsets; ++i) {
				subsetOptimizationFctOpt.constraints.minWeights[i] = opt.constraints.minWeights[subsetAssetsIdx[i]-1];
			}
		}
		if (opt.constraints.maxWeights) {
			for (var i = 0; i < sizeSubsets; ++i) {
				subsetOptimizationFctOpt.constraints.maxWeights[i] = opt.constraints.maxWeights[subsetAssetsIdx[i]-1]
			}
		}
		
		// Compute the optimal portfolio for the selected assets using the 
		// provided portfolio optimization algorithm.
		//
		// In case the weights cannot be computed due to the infeasibility of the problem
		// (for instance, because of lower/upper bounds), another portfolio is generated.
		try {
			var subsetWeights = subsetOptimizationFct(subsetAssetsIdx, subsetOptimizationFctOpt);
			
			if (subsetWeights.length != sizeSubsets) {
				throw new Error('internal error: the portfolio optimization method did not return the expected number of weights');
			}
		}
		catch (e) {
			if (e.message === "infeasible portfolio optimization problem") {
				continue;
			}
			else {
				throw(e);
			}
		}

		// Transform the computed weights for the selected assets into their equivalent 
		// computed weights for the original assets (e.g. adding zero weights on non-selected
		// assets).
		var weights = Matrix_.zeros(nbAssets, 1);
		for (var i = 0; i < sizeSubsets; ++i) {
			weights.setValueAt(subsetAssetsIdx[i], 1, 
							   subsetWeights[i]);
		}

		// Save the resulting original assets weights
		generatedPortfoliosWeights[nbFeasibleGeneratedPortfolios++] = weights;
	}
	
	// Computation of the final portfolio weights

	// Resize of the storage space for the generated portfolios weights
	generatedPortfoliosWeights.length = nbFeasibleGeneratedPortfolios;

	// In case there was no generated portfolios, because they were all
	// infeasible, abort the process.
	//
	// Otherwise, depending on the proportion of infeasible portfolios generated,
	// possibly also abort the process.
	if (nbFeasibleGeneratedPortfolios === 0) {
		throw new Error('no feasible portfolio generated');
	}
	else {
		var nbInfeasibleGeneratedPortfolios = nbSubsets - nbFeasibleGeneratedPortfolios;
		
		if (nbInfeasibleGeneratedPortfolios >= 1 && nbInfeasibleGeneratedPortfolios/nbSubsets >= maxInfeasibleSubsetsRatio) {
			throw new Error('too many infeasible portfolios generated');
		}
	}
	
	// Note: the geometric center and the geometric median of m points in R^n
	// both lie within the convex hull of these m points.
	//
	// As a consequence:
	// - Long-only or long-short constraints
	// - Partial or full investment constraints
	// - Minimum/maximum weights constraints
	// imposed on the subset portfolios are automatically satisfied by the 
	// final portfolio.
	//
	// This is also the case for any convex and/or linear constraints (e.g.
	// 	maximum volatility constraint).
	var weights = null;
	if (subsetsAggregationMethod == 'average') {
		weights = geometricCenter_(generatedPortfoliosWeights);
	}
	else if (subsetsAggregationMethod == 'median') {
		weights = geometricMedian_(generatedPortfoliosWeights);
	}
	else  {
		throw new Error('internal error');
	}
	
	
	// ------
	
	// Return the computed portfolio weights
	return weights.toArray();
}



/**
* @function randomSubspaceMeanVarianceOptimizationWeights
*
* @summary Compute the weights of a portfolio using the random subspace optimization method 
* applied to the Markowitz mean-variance optimization algorithm.
*
* @description This function returns the weights w_1,...,w_n associated to a long-only fully or partially 
* invested portfolio of n assets, as computed by the random subspace optimization method applied 
* to the Markowitz mean-variance optimization algorithm of the first reference.
*
* C.f. the method randomSubspaceOptimizationWeights for more details.
*
* @see Harry M. Markowitz, Portfolio Selection, Efficient Diversification of Investments, Second edition, Blackwell Publishers Inc.
* @see <a href="https://www.stat.berkeley.edu/~breiman/Using_random_forests_V3.1.pdf">Breiman, L (2002), Manual On Setting Up, Using, And Understanding Random Forests V3.1</a>
*
* @param {Array.<number>} mu the returns of the n assets in the considered universe, array of n real numbers.
* @param {Array.<Array.<number>>} sigma the covariance matrix (sigma_ij),i,j=1..n of the n assets in the considered universe, array of n array of n real numbers statisfying sigma[i-1][j-1] = sigma_ij.
* @param {object} opt parameters for the random subspace optimization method, described in the method randomSubspaceOptimizationWeights, with 
* opt.sizeSubsets defaulting to the floored positive solution of the equation x^2 + 3x - SQRT(2*n*(n+3)) = 0.
* @param {number} opt.subsetsMeanVarianceOptimizationOpt parameters for the mean-variance optimization algorithm, 
* described in the method meanVarianceOptimizationWeights
* @return {Array.<number>} the weights corresponding to the computed portfolio, array of n real numbers.
*
* @example
* randomSubspaceMeanVarianceOptimizationWeights([0.1, 0.2, 0.15], [[1, 0.3, -0.2], [0.3, 1, 0.6], [-0.2, 0.6, 1]], 
*                                   			{ subsetsGenerationMethod: 'deterministic', 
*		  										  subsetsMeanVarianceOptimizationOpt: {
*													  constraints: {
*														volatility: Math.sqrt(0.10)
*													  }
*												  }
*												})
* // ~[0.09, 0.19, 0.12]
*/
self.randomSubspaceMeanVarianceOptimizationWeights = function(mu, sigma, opt) {	
	// Initialize the options structure
	if (opt === undefined) {
		opt = {};
	}
	if (opt.constraints === undefined) {
		opt.constraints = {};
	}
	if (opt.subsetsMeanVarianceOptimizationOpt === undefined) {
		opt.subsetsMeanVarianceOptimizationOpt = {};
	}
	if (opt.subsetsMeanVarianceOptimizationOpt.constraints === undefined) {
		opt.subsetsMeanVarianceOptimizationOpt.constraints = {};
	}
	
	// ------
	
	
	// Initializations
	var mu = new Matrix_(mu);
	var sigma = new Matrix_(sigma);
	var nbAssets = sigma.nbColumns;


	// ------	
	
	
	// Decode options

	// The default size of the subsets to generate is obtained following 
	// the sixth reference: for a random forest based on m features, the default 
	// value of the number of sub features to use in each random tree is SQRT(m).
	//
	// Applied to the case of mean-variance optimization:
	// - The number of features is nbAssets (the number of returns to estimate) +
	// nbAssets*(nbAssets+1)/2 (the number of variances/covariances to estimate), 
	// which is equal to nbAssets*(nbAssets+3)/2
	//
	// - The number of assets X corresponding to a number of features SQRT(nbAssets*(nbAssets+3)/2)
	// is the solution of the equation X*(X+3)/2 = SQRT(nbAssets*(nbAssets+3)/2),
	// i.e. the solution of the equation X^2 + 3X - SQRT(2*nbAssets*(nbAssets+3)) = 0.
	if (opt.sizeSubsets === undefined) {
		// Define the coefficients of the second order polynomial x^2 + 3x - (2*nbAssets*(nbAssets+3))
		var a = 1;
		var b = 3;
		var c = -Math.sqrt(2*nbAssets*(nbAssets+3));
				
		// Extract the strictly positive root x^* of the equation x^2 + 3x - (2*nbAssets*(nbAssets+3)) = 0, using a stable numerical formula
		var b_p = b/2; // reduced discriminant
		var sign_b_p = 1;
		var disc = b_p*b_p - a*c; // > 0 because a,b are positive and c is negative
		var q = -(b_p + Math.sqrt(disc));
		var r2 = c/q; // positive because c and q are negative
		
		opt.sizeSubsets = Math.max(2, Math.floor(r2));
	}

	
	// ------
	
	
	// Core process
	
	// Define the options for the mean-variance optimization algorithm
	opt.subsetOptimizationFctOpt = opt.subsetsMeanVarianceOptimizationOpt;
	
	// Temporary storage space for the subsets returns vectors and the 
	// subsets covariance matrices, to improve performances.
	opt.subsetsMeanVarianceOptimizationOpt.subsetMu = Matrix_.zeros(opt.sizeSubsets, 1);
	opt.subsetsMeanVarianceOptimizationOpt.subsetSigma = Matrix_.zeros(opt.sizeSubsets, opt.sizeSubsets);
	

	// Definition of the portfolio optimization algorithm to use on the subsets
	function subsetMeanVarianceOptimization(subsetAssetsIdx, subsetsMeanVarianceOptimizationOpt) {
		// Extract the returns of the selected assets
		var subsetMu = mu.submatrix(subsetAssetsIdx, [1], subsetsMeanVarianceOptimizationOpt.subsetMu);

		// Extract the covariance matrix of the selected assets
		var subsetSigma = sigma.submatrix(subsetAssetsIdx, subsetAssetsIdx, subsetsMeanVarianceOptimizationOpt.subsetSigma);
		
		// Return the weights of the mean-variance optimal portfolio of the selected assets
		//
		// Catches non reachable return/volatility constraint, as well as infeasible problem, which all
		// can be raised due to the subsetting of assets.
		try {
			return self.meanVarianceOptimizationWeights(subsetMu, subsetSigma, subsetsMeanVarianceOptimizationOpt);
		}
		catch (e) {
			if (e.message.includes('no matching efficient portfolio') ||
				e.message === 'infeasible problem detected: the restricted simplex is empty') {
				throw new Error('infeasible portfolio optimization problem');
			}
			else {
				throw(e);
			}
		}
		
	}

	// Return the computed portfolio weights using the generic random subspace optimization method
	return self.randomSubspaceOptimizationWeights(nbAssets, subsetMeanVarianceOptimization, opt);
}

/**
 * @file Functions related to random weights portfolio.
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 


/**
* @function randomWeights
*
* @summary Compute the weights of a randomly generated portfolio.
*
* @description This function returns the weights w_1,...,w_n associated to a fully invested
* and long-only random portfolio of n assets.
*
* Optionally, the following constraints can be added:
* - Minimum number of assets to include in the portfolio
* - Maximum number of assets to include in the portfolio
* - Minimum weight of each asset that is included in the portfolio
* - Maximum weight of each asset that is included in the portfolio
* - Minimum exposure of the portfolio
* - Maximum exposure of the portfolio
*
* In case cardinality constraints are provided:
* - The minimum/maximum weight of each asset is then to be understood as applying only to
* the assets selected to be included in the portfolio.
* So, for example, in case a minimum weight constraint is defined for a non-selected asset,
* this minimum weight constraint is discarded.
*
* Random portfolios have several applications in asset allocation, c.f. the first reference, as
* well as in trading strategies evaluation, c.f. the second reference.
*
* The algorithms used internally allow the random portfolios to be generated uniformly
* among all the feasible portfolios.
*
* @see <a href="https://arxiv.org/abs/1008.3718">William T. Shaw, Monte Carlo Portfolio Optimization for General Investor Risk-Return Objectives and Arbitrary Return Distributions: a Solution for Long-only Portfolios</a>
* @see <a href="https://doi.org/10.1007/3-540-36626-1_11">Burns P. (2007) Random Portfolios for Performance Measurement. In: Kontoghiorghes E.J., Gatu C. (eds) Optimisation, Econometric and Financial Analysis. Advances in Computational Management Science, vol 9. Springer, Berlin, Heidelberg</a>
*
* @param {number} nbAssets the number of assets in the universe, natural integer superior or equal to 1.
* @param {object} opt optional parameters for the algorithm.
* @param {number} opt.maxIter the maximum number of iterations of the algorithm, a strictly positive natural integer; defaults to 10000.
* @param {number} opt.constraints.minNbAssets the minimum number of assets to include in the portfolio, an integer i satisfying 1 <= i <= nbAssets; defaults to 1.
* @param {number} opt.constraints.maxNbAssets the maximum number of assets to include in the portfolio, an integer j satisfying i <= j <= nbAssets; defaults to nbAssets.
* @param {Array.<number>} opt.constraints.minWeights an optional array of size n (l_i),i=1..n containing the minimum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of zeros.
* @param {Array.<number>} opt.constraints.maxWeights an optional array of size n (u_i),i=1..n containing the maximum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of ones.
* @param {number} opt.constraints.minExposure the minimum exposure of the portfolio expressed in percent, a strictly positive real number satisfying 0 < opt.constraints.minExposure <= opt.constraints.maxExposure <= 1; defaults to 1.
* @param {number} opt.constraints.maxExposure the maximum exposure of the portfolio expressed in percent, a strictly positive real number satisfying 0 < opt.constraints.minExposure <= opt.constraints.maxExposure <= 1; defaults to 1.
* @return {Array.<number>} the weights corresponding to a random portfolio, array of real numbers of length nbAssets.
*
* @example
* randomWeights(5);
* // ~[0, 0 0.33, 0.33, 0.33]
*
* randomWeights(5, { constraints: { minExposure: 0.4, maxExposure: 0.8, minWeights: [0.2,0.1,0.4,0.3,0], maxWeights: [0.9,0.8,0.4,0.7,1] } });
* // ~[0, 0.10498858706451236, 0, 0.32412466798840733, 0.04620902965198814]
*/
self.randomWeights = function (nbAssets, opt) {
	// Initialize the options structure
	if (opt === undefined) {
		opt = {};
	}
	if (opt.constraints === undefined) {
		opt.constraints = {};
	}
	
	
	// ------	
	
	
	// Decode options
	
	// Presence of cardinality constraints 
	var cardinalityConstraints = opt.constraints.minNbAssets || opt.constraints.maxNbAssets;

	// The minimum number of assets to include in the portfolio
	var nbMinAssets = opt.constraints.minNbAssets;
	if (nbMinAssets === undefined) {
		nbMinAssets = 1;
	}
	
	// The maximum number of assets to include in the portfolio
	var nbMaxAssets = opt.constraints.maxNbAssets;
	if (nbMaxAssets === undefined) {
		nbMaxAssets = nbAssets;
	}

	// The minimum exposure of the portfolio
	var minExposure = opt.constraints.minExposure;
	if (minExposure === undefined) {
		minExposure = 1;
	}
	
	// The maximum exposure of the portfolio
	var maxExposure = opt.constraints.maxExposure;
	if (maxExposure === undefined) {
		maxExposure = 1;
	}
	
	// The maximum number of iterations
	var maxIter = opt.maxIter;
	if (maxIter === undefined) {
		maxIter = 10000;
	}

	
	// ------	
	
	
	// Core process
	//
	// Repeat steps 1 - 7 until the generated weights are feasible w.r.t. all the constraints:
	// - Cardinality constraints
	// - Minimum/maximum weights constraints
	// - Minimum/maximum exposure
	var nbIter = -1;
	while (true) {
		// Increment the number of iterations
		++nbIter;
		
		// Check the number of iterations
		if (nbIter > maxIter) {
			throw new Error('maximum number of iterations reached');
		}
		
		
		// 1 - Generate the number of assets to include in the portfolio (uniform generation),
		//     by generating a random number of free assets.
		var nbSelectedAssets = Math.floor(Math.random() * (nbMaxAssets - nbMinAssets +1)) + nbMinAssets;
		
		// 2 - Generate the indices of the assets to include in the portfolio (uniform generation)
		var selectedAssetsIdx = new randomKSubsetsIterator_(nbAssets, nbSelectedAssets, false).next();

		// 3 - Generate the exposure of the portfolio (uniform generation)
		//
		//     From this step, the potential partial exposure of the portfolio is managed thanks
		//     to a slack asset variable and its associated exact weight constraint.
		var portfolioExposure = Math.random() * (maxExposure - minExposure) + minExposure;
		var nbSlackAssets = 0;
		if (portfolioExposure !== 1) {
			// A slack asset variable is added to the selected assets variables
			//
			// By convention, its index is nbSelectedAssets + 1
			nbSlackAssets = 1;
			
			// Definition of weights constraints for the nbSelectedAssets assets, plus the slack asset variable
			var lowerBounds = typeof Float64Array === 'function' ? new Float64Array(nbSelectedAssets + nbSlackAssets) : new Array(nbSelectedAssets + nbSlackAssets);
			var upperBounds = typeof Float64Array === 'function' ? new Float64Array(nbSelectedAssets + nbSlackAssets) : new Array(nbSelectedAssets + nbSlackAssets);

			// Default weights constraints for the selected assets
			for (var i = 0; i < nbSelectedAssets; ++i) {
				lowerBounds[i] = 0;
				upperBounds[i] = 1;
			}
			
			// Weight constraint (exact) for the slack asset variable
			var portfolioExposureWeightConstraint = 1 - portfolioExposure;	
			lowerBounds[nbSelectedAssets] = portfolioExposureWeightConstraint;
			upperBounds[nbSelectedAssets] = portfolioExposureWeightConstraint;
		}
		
		// 4 - In case minimum/maximum weights constraints are provided, automatically map
		//     these constraints to the generated assets.
		if (opt.constraints.minWeights) {
			// In case default lower bounds constraints have already been set in step 3 above
			// due to a partial investment constraint, the lowerBounds variable must not be overridden.
			//
			// Otherwise, there is no slack asset variable to manage.
			if (portfolioExposure === 1) {
				var lowerBounds = typeof Float64Array === 'function' ? new Float64Array(nbSelectedAssets) : new Array(nbSelectedAssets);
			}
			
			// Weights constraints for the selected assets
			for (var i = 0; i < nbSelectedAssets; ++i) {
				lowerBounds[i] = opt.constraints.minWeights[selectedAssetsIdx[i]-1];
			}
			
			// Weight constraint for the potential slack asset variable has already been
			// set in step 3 above
		}
		if (opt.constraints.maxWeights) {
			// In case default upper bounds constraints have already been set in step 3 above
			// due to a partial investment constraint, the upperBounds variable must not be overridden.
			//
			// Otherwise, there is no slack asset variable to manage.
			if (portfolioExposure === 1) {
				var upperBounds = typeof Float64Array === 'function' ? new Float64Array(nbSelectedAssets) : new Array(nbSelectedAssets);
			}
			
			// Weights constraints for the selected assets
			for (var i = 0; i < nbSelectedAssets; ++i) {
				upperBounds[i] = opt.constraints.maxWeights[selectedAssetsIdx[i]-1];
			}
			
			// Weight constraint for the potential slack asset variable has already been
			// set in step 3 above
		}		
		
		// 5 - Test for the feasibility of the generated assets w.r.t. the optional lower and upper bounds
		try {
			var sumBounds = simplexEmptinessCheck_(nbSelectedAssets + nbSlackAssets, lowerBounds, upperBounds);
		}
		catch (e) {
			// In case the check above results in an exception, it means the generated assets are not feasible.
			//
			// So, generate a whole new set of number of assets / assets indices.
			continue;
		}
		
		// 6 - Generate the weights of the assets to include in the portfolio (uniform generation)
		var selectedAssetsWeights = new simplexRandomSampler_(nbSelectedAssets + nbSlackAssets, lowerBounds, upperBounds).sample();
		
		// 7 - Test for the feasibility of the generated weights w.r.t. the optional cardinality constraints,
		//     i.e., exactly the first nbSelectedAssets assets weights must be non zero.
		try {
			if (cardinalityConstraints) {
				for (var i = 0; i < nbSelectedAssets; ++i) {
					// In case of a zero weight, generate a whole new set of number of assets / assets indices
					if (selectedAssetsWeights[i] == 0) { 
						throw new Error('generated weights not compatible with cardinality constraints');
					}
				}
			}
		}
		catch (e) {
			// In case the check above results in an exception, it means the generated assets are not feasible.
			//
			// So, generate a whole new set of number of assets / assets indices.
			continue;
		}
		
		// At this stage, the generated weights are feasible w.r.t. all constraints,
		// so that the process can be stopped.
		break;
	}

	
	// Compute the final weights vector:
	// - The weights associated to assets not included in the portfolio at step 2 are set to zero
	// - The weights associated to assets included in the portfolio at step 2 are set to their values generated at step 6
	var weights = Matrix_.zeros(nbAssets, 1);
	for (var i = 0; i < nbSelectedAssets; ++i) {
		// Extract included assets information
		var assetIdx = selectedAssetsIdx[i];
		var assetWeight = selectedAssetsWeights[i];
		
		// Update the weights vector
		weights.setValueAt(assetIdx, 1, assetWeight);
	}

	// Return the computed weights
	return weights.toArray();
}


/**
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

 


/**
* @function riskBudgetingWeights
*
* @summary Compute the weights of the risk budgeting portfolio.
*
* @description This function returns the weights w_1,...,w_n associated to the fully invested and long-only portfolio
* of n assets with risk budgeting constraints.
*
* This portfolio has the property that the total contribution 
* of each asset to the risk of the portfolio is equal to a pre-determined budget weight.
*
* This portfolio is unique, provided the covariance matrix of the assets is definite positive.
* 
* Optionally, the following constraints can be added:
* - Minimum weight of each asset that is included in the portfolio
* - Maximum weight of each asset that is included in the portfolio
*
* To be noted that in case weights constraints are defined, the concept of risk budget does not make any sense, 
* c.f. the sixth reference.
*
* The algorithm used internally is a cyclical coordinate descent, c.f. the second reference, whose convergence is guaranteed
* if the covariance matrix of the assets is semi-definite positive.
*
* @see <a href="https://ssrn.com/abstract=2009778">Bruder, Benjamin and Roncalli, Thierry, Managing Risk Exposures Using the Risk Budgeting Approach (January 20, 2012).</a>
* @see <a href="https://arxiv.org/abs/1311.4057">Théophile Griveau-Billion, Jean-Charles Richard, Thierry Roncalli; A Fast Algorithm for Computing High-dimensional Risk Parity Portfolios. eprint arXiv:1311.4057</a>
* @see <a href="https://link.springer.com/article/10.1023/A:1017501703105">Tseng P., Convergence of a Block Coordinate Descent Method for Nondifferentiable Minimization, Journal of Optimization Theory and Applications, 109(3), pp. 475-494. (2001)</a>
* @see <a href="https://doi.org/10.1090/mcom/3530">Stephen J. Wright, Ching-pei Lee, Analyzing random permutations for cyclic coordinate descent, Math. Comp.</a>
* @see <a href="http://proceedings.mlr.press/v29/Glasmachers13.html">Tobias Glasmachers, Urun Dogan, Accelerated Coordinate Descent with Adaptive Coordinate Frequencies, Proceedings of the 5th Asian Conference on Machine Learning, PMLR 29:72-86, 2013.</a>
* @see <a href="https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3331184">RONCALLI Thierry, RICHARD Jean-Charles, CONSTRAINED RISK BUDGETING PORTFOLIOS, </a>
*
* @param {Matrix_|Array.<Array.<number>>} sigma the covariance matrix (sigma_ij),i,j=1..n of the n assets in the considered universe, square Matrix or array of n array of n real numbers statisfying sigma[i-1][j-1] = sigma_ij.
* @param {Array.<number>} rb the risk budgets, array of n real strictly positive numbers summing to one.
* @param {object} opt the optional parameters for the algorithm.
* @param {number} opt.eps the tolerance parameter for the convergence of the algorithm, a strictly positive real number; defaults to 1e-10.
* @param {number} opt.epsSdp the tolerance parameter for testing the semi-definite positiveness of the covariance matrix, a strictly positive real number; defaults to 1e-12.
* @param {number} opt.maxCycles the maximum number of cycles of the algorithm, a strictly positive natural integer; defaults to 10000.
* @param {number} opt.nbCycles the exact number of cycles of the algorithm, a strictly positive natural integer, in which case the values of opt.eps and opt.maxCycles are discarded,
* or -1; defaults to -1.
* @param {string} opt.coordinatesSampler, the type of coordinates sampler to use, a string either equal to:
* - 'cyclic', in order to use a cyclic coordinates sampler, called "cyclic CD" in the fourth reference
* - 'shuffledCyclic', in order to use a uniformly randomly shuffled cyclic coordinates sampler, called "random-permutations CD" in the fourth reference
* - 'randomized', in order to use a uniformly randomized coordinates sampler, called "fully randomized CD" in the fourth reference
* - 'acf', in order to use the adaptive coordinate frequencies coordinates sampler, as described in the fifth reference
*; defaults to 'cyclic'.
* @param {boolean} opt.outputPortfolioVolatility a boolean indicating whether the portfolio volatility should be provided in output
* (if set to true) or not (if set to false); defaults to false.
* @param {Array.<number>} opt.constraints.minWeights an array of size n (l_i),i=1..n containing the minimum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of zeros.
* @param {Array.<number>} opt.constraints.maxWeights an array of size n (u_i),i=1..n containing the maximum weights of the assets that are included in the portfolio with 0 <= l_i <= u_i <= 1, i=1..n; defaults to an array made of ones.
*
* @return {Array.<number>|Array.<Array.<number>>} if opt.outputPortfolioVolatility is set to false, the weights corresponding to the risk budgeting portfolio, 
* array of n real numbers, and if opt.outputPortfolioVolatility is set to true, an array arr of two elements:
* - arr[0], the weights corresponding to the risk budgeting portfolio, array of n real numbers
* - arr[1], the volatility of the computed risk budgeting portfolio, a real number
*
* @example
* riskBudgetingWeights([[0.1,0], [0,0.2]], [0.25, 0.75], {eps: 1e-10, maxCycles: 1000});
* // [~0.45, ~0.55]
*/
self.riskBudgetingWeights = function (sigma, rb, opt) {
	// Internal function to compute the volatility of a portfolio
	function computeVolatility(x, sigma_x) {
		// Compute the variance x'*SIGMA*x
		var sigma_x_x = Matrix_.vectorDotProduct(sigma_x, x);		

		// In case the variance is numerically zero, which can occur with 
		// a semi-positive definite covariance matrix, it is replaced with zero.
		//
		// Otherwise, if the variance is negative, stops the algorithm,
		// since the covariance matrix is then not numerically semi-positive definite.
		if (Math.abs(sigma_x_x) <= epsSdp) {
			sigma_x_x = 0;
		}
		else if (sigma_x_x < 0 && sigma_x_x < -epsSdp) {
			throw new Error('negative volatility during iteration ' + iter + ', covariance matrix might not be semi-definite positive');
		}
		
		// Compute the volatility SQRT(x'*SIGMA*x)
		var s_x = Math.sqrt(sigma_x_x);
	   
		// Return the computed volatility
		return s_x;
	}

	
	// Internal function to compute the solution x^*(lambda) to the minimization problem
	// described in the second and sixth references, using a coordinate descent
	// method.
	//
	// It returns the computed solution x^*(lambda).
	function coordinatesDescentSolve(lambda, lowerBounds, upperBounds) {
		// Initial point for the algorithm is an equal weight vector
		var x = Matrix_.fill(nbAssets, 1, function(i,j) { return 1/nbAssets; });
		var log_x = x.elemMap(function(i,j,val) { return Math.log(val);});
		
		// Placeholder for the previous x
		var x_old = Matrix_.copy(x);

		// Preparational computations
		var sigma_x = Matrix_.xy(sigma, x); // SIGMA*x
		var s_x = computeVolatility(x, sigma_x); // sigma(x)
		
		var rb_d_log_x = Matrix_.vectorDotProduct(rb, log_x); // Matrix_.vectorDotProduct(rb, log_x)
		var obj_old = 0.5 * s_x - rb_d_log_x; // the objective function to be minimized, c.f. formula 3 of the second reference
		
		// Initialization of the coordinates sampler
		var cs = new coordinatesSampler(nbAssets);
		
		// Main loop until convergence, guaranteed as per hypotheses on sigma and b
		// in case of essentially cyclic coordinates sampling.
		//
		// To be noted that what is guaranteed is the convergence of
		// the objective function values, c.f. the third reference, 
		// so that the convergence criteria will be based on the objective function values.
		//
		// To also be noted that the convergence of the x_k sequence is not guaranteed 
		// (the only guarantee is that all the cluster points of the x_k sequence 
		// are minimizers of the objective function).
		var cycle = 0;
		while (true) {
			// Check the exact number of cycles
			if	(nbCycles != -1 && cycle == nbCycles) {
				break;
			}

			// Check the maximum number of cycles
			if (nbCycles == -1 && cycle >= maxCycles) {
				throw new Error('maximum number of cycles reached: ' + maxCycles);
			}

			// Update the number of cycles
			++cycle;


			// Generate the coordinates to use in the next cycle of coordinates descent
			cs.generateCoordinates();

		   
			// Perform one full cycle of coordinates descent
			var obj_old_i
			var obj_new_i;
			while (true) {
				// Generate the index of the current coordinate to optimize in 1D,
				// in case such an index is remaining.
				var i = cs.sampleCoordinate();
				if (i == -1) {
					break;
				}

				// In case the coordinate sampler is ACF, 
				// compute the old value of the objective function
				if (opt.coordinatesSampler === 'acf') {
					obj_old_i = 0.5 * s_x - rb_d_log_x;
				}
				
				
				// Save the old asset weight before any update
				var xi_old = x.data[i-1];
				var log_xi_old = log_x.data[i-1];


				// Define the coefficients of the second order polynomial (a*x_i)^2 + b*x_i + c_i, c.f. the second reference
				var a = sigma.data[(i-1)*sigma.nbColumns + (i-1)]; // sigma_i^2, always > 0
				var b = sigma_x.data[i-1] - x.data[i-1] * a; // (SIGMA*x)_i - x_i*sigma_i^2, might be any sign
				var c = -lambda * rb.data[i-1] * s_x; // -lambda * b_i * sigma(x), always <= 0 (== 0 iff the covariance matrix is semi-definite positive and sigma(x) == 0)


				// Extract the strictly positive root x_i^* of the equation (a*x_i)^2 + b*x_i + c = 0, using a stable numerical formula
				var b_p = b/2; // reduced discriminant
				var sign_b_p = (b_p >= 0) ? 1 : -1; // Math.sign is not supported everywhere plus it is mandatory that for b_p == 0 this returns 1
				var disc = b_p*b_p - a*c;
				if (disc < 0) {
				   throw new Error('internal error: negative discriminant detected, the covariance matrix might not be semi-definite positive');
				}
				var q = -(b_p + sign_b_p * Math.sqrt(disc));
				var r1 = q/a;
				var r2 = c/q;
				
				var xi_star;
				if (r1 > 0) {
					xi_star = r1;
				}
				else if (r2 > 0) {
					xi_star = r2;
				}
				else {
					throw new Error('internal error: no strictly positive root detected, the covariance matrix might not be semi-definite positive');
				}
			   

				// Possibly truncate the strictly positive root above in case min/max weights are provided
				if (lowerBounds && xi_star < lowerBounds[i-1]) {
					xi_star = lowerBounds[i-1];
				}
				if (upperBounds && xi_star > upperBounds[i-1]) {
					xi_star = upperBounds[i-1];
				}
				
				
				// Update the asset weight
				x.data[i-1] = xi_star;
				
				// Update the asset weight log value, and <rb / log(x)>
				log_x.data[i-1] = Math.log(xi_star);
				
				rb_d_log_x -= log_xi_old * rb.data[i-1];
				rb_d_log_x += log_x.data[i-1] * rb.data[i-1];


				// Compute the updated SIGMA*x and SQRT(x'*SIGMA*x) elements for next loop evaluation.
				//
				// The update of the vector SIGMA*x uses the efficient update procedure described
				// in the second reference, based on the fact that only one coordinate of the vector x
				// changes per iteration.
				//
				// The update of the value x'*SIGMA*x does not use an "efficient" procedure,
				// because it requires a dot product, which is then equivalent to the full recomputation
				// of the volatility from SIGMA*x.

				// Compute the updated SIGMA*x
				for (var j = 1; j <= nbAssets; ++j) {
					sigma_x.data[j-1] += sigma.data[(j-1)*sigma.nbColumns + (i-1)] * xi_star;
					sigma_x.data[j-1] -= sigma.data[(j-1)*sigma.nbColumns + (i-1)] * xi_old;
				}

				// Compute the updated volatility SQRT(x'*SIGMA*x)
				s_x = computeVolatility(x, sigma_x);
				
				
				// In case the coordinate sampler is ACF:
				// - Compute the new value of the objective function
				// - Compute the gain for the current coordinate
				// - Update the scheduling preference for the current coordinate index i,
				//   or update the average gain
				if (opt.coordinatesSampler === 'acf') {
					// Compute the new value of the objective function
					obj_new_i = 0.5 * s_x - rb_d_log_x;
					
					// Compute the gain for the current coordinate, with 
					// gain = f(old) - f(new), from the code implementation of the fifth
					// reference by their authors.
					var gain = obj_old_i - obj_new_i;
					
					// If the cycle is the first one, update the average gain, and otherwise,
					// update the scheduling preference for the current coordinate index i.
					if (cycle == 1) {
						cs.updateAverageGain(gain);
					}
					else {
						cs.updateSchedulingPreference(i, gain);
					}
				}	
			}

		   
			// Compute the updated value of the objective function
			var obj_new = 0.5 * s_x - rb_d_log_x;


			// Check the necessary and sufficient convergence condition: |obj* - obj| <= eps,
			// unless an exact number of cycles is required.
			if (nbCycles == -1 && Math.abs(obj_new - obj_old) <= eps) {
				break;
			}
			
			
			// Prepare the next cycle:
			// - Update the previous objective function value
			obj_old = obj_new;
		}
		
		// Return the computed solution
		return x;
	}
	
	
	// Internal function to sample coordinates in a cyclic way.
	//
	// This is an essentially cyclic coordinates sampler, as
	// defined in the third reference.
	function cyclicCoordinatesSampler(n) {
		// Initializations
		this.n = n;
		this.k = n;
	   
	   
		// The sampling function, returning 1,2,...,n in this order,
		// and -1 to indicate that the sampling is finished.
		this.sampleCoordinate = function() {
			if (this.k == this.n) {
				return -1;
			}
			else {
				return ++this.k;
			}        
		}
		
		
		// The function generating the coordinates for one cycle
		this.generateCoordinates = function() {
			// Re-set the index
			this.k = 0;
		}
	}

	
	// Internal function to sample coordinates in a randomly shuffled 
	// cyclic way.
	//
	// This is an essentially cyclic coordinates sampler, as
	// defined in the third reference.
	function shuffledCyclicCoordinatesSampler(n) {
		// Initializations
		this.n = n;
		this.k = n;
		
		// The coordinates set
		this.r = typeof Uint32Array === 'function' ? new Uint32Array(n) : new Array(n);
		for (var i = 0; i < n; ++i) {
			this.r[i] = i+1;
		}
	   
	   
		// The sampling function, returning the elements this.r[0],...,this.r[n-1] in this order,
		// and -1 to indicate that the sampling is finished.
		this.sampleCoordinate = function() {
			if (this.k == this.n) {
				return -1;
			}
			else {
				return this.r[this.k++];
			}        
		}
		
		
		// The function generating the coordinates for one cycle
		this.generateCoordinates = function() {
			// Re-shuffle the coordinates
			this.r = new randomPermutationsIterator_(undefined, this.r, true).next();
			
			// Re-set the index
			this.k = 0;
		}
	}
	

	// Internal function to sample coordinates in a uniform random 
	// way.
	function randomizedCoordinatesSampler(n) {
		// Initializations
		this.n = n;
		this.k = n;
		
		var p = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n);
		for (var i = 0; i < n; ++i) {
			p[i] = 1/n;
		}
		this.s = new aliasMethodSampler_(p);
	   
	   
		// The sampling function, returning a coordinate chosen uniformly at random
		// among the set {1,...,n}, and -1 to indicate that the sampling is finished
		// after n samplings.
		this.sampleCoordinate = function() {
			if (this.k == this.n) {
				return -1;
			}
			else {
				++this.k;
				return this.s.sample() + 1;
			}        
		}
		
		
		// The function generating the coordinates for one cycle
		this.generateCoordinates = function() {
			// Re-set the index
			this.k = 0;
		}
	}

	
	// Internal function to sample coordinates following the
	// adaptive coordinate frequencies of the fifth reference.
	//
	// This is an essentially cyclic coordinates sampler, as
	// defined in the third reference.
	function adaptiveCoordinateFrequenciesSampler(n) {
		// Initializations
		this.n = n;
		this.k = 0;
		
		// Initializations of the ACF strategy constants
		this.change_rate = 1/5; // c in the fifth reference
		this.p_min = 1/20;
		this.p_max = 20;	
		
		// Placeholder for the coordinates set I, allocated with the
		// maximum possible size of I which is 2n, c.f. the fifth reference.
		this.idx_set_tmp = typeof Uint32Array === 'function' ? new Uint32Array(2*n) : new Array(2*n);

		// The coordinates set I, null at initialization, which will contain 
		// between n and 2n coordinates for a given cycle, c.f. fifth reference.
		this.idx_set = null;
		this.idx_set_len = 0;
		
		// The preferences for scheduling p_i, i=1..n
		this.pref = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n);
		for (var i = 0; i < n; ++i) {
			this.pref[i] = 1;
		}
		this.prefsum = n; // sum p_i, i=1..n
		
		// The accumulators a_i, i=1..n
		//
		// Note: contrary to the fifth reference, the accumulators are not initialized to 0,
		// but to 0.5, which is the value the authors of the fifth reference used in their 
		// implementations.
		this.acc = typeof Float64Array === 'function' ? new Float64Array(n) : new Array(n);
		for (var i = 0; i < n; ++i) {
			this.acc[i] = 0.5;
		}
			
		// Variables for the self-adaptation of the performances monitoring
		this.gain_learning_rate = 1/n;
		this.average_gain = 0;

		
		// The sampling function, returning the elements this.r[0],...,this.r[n-1] in this order,
		// and -1 to indicate that the sampling is finished.
		this.sampleCoordinate = function() {
			if (this.k == this.idx_set_len) {
				return -1;
			}
			else {
				return this.idx_set[this.k++];
			}        
		}
		
		
		// The function generating the coordinates for one cycle
		this.generateCoordinates = function() {
			// Re-set the index
			this.k = 0;
			
			// Re-compute the index set
			this.idx_set_len = 0;
			var q = this.n / this.prefsum;
			for (var i = 0; i < this.n; ++i) {
				var a_i = this.acc[i] + q * this.pref[i];
				var a_i_f = Math.floor(a_i);
				
				for (var j = 0; j < a_i_f; ++j) {
					this.idx_set_tmp[this.idx_set_len] = i + 1;
					this.idx_set_len++;
				}
				
				this.acc[i] = a_i - a_i_f;
			}
		
			// Shuffle the index set
			this.idx_set = new randomPermutationsIterator_(undefined, this.idx_set_tmp.slice(0, this.idx_set_len), true).next();
		}
		
		
		//
		this.updateSchedulingPreference = function(i, gain) {
			// Compute the new scheduling preference for index i
			var p_new = this.pref[i-1] * Math.exp(this.change_rate * (gain / this.average_gain - 1));
			
			// Truncate the new scheduling preference for index i, if required
			if (p_new < this.p_min) {
				p_new = this.p_min;
			}
			else if (p_new > this.p_max) {
				p_new = this.p_max;
			}
			
			// Update the scheduling preference for index i
			this.prefsum = this.prefsum + p_new - this.pref[i-1];
			this.pref[i-1] = p_new;
			
			// Update the average gain
			this.average_gain = (1 - this.gain_learning_rate) * this.average_gain + this.gain_learning_rate * gain;
		}
		
		
		//
		this.updateAverageGain = function(gain) {
			this.average_gain += gain / this.n;
		}
	}
	
	// ------

	// Initialize the options structure
	if (opt === undefined) {
		opt = {};
	}
	if (opt.constraints === undefined) {
		opt.constraints = {};
	}
	
	// Initialize the options default values
	if (opt.eps === undefined) {
		opt.eps = 1e-10;
	}
	if (opt.epsSdp === undefined) {
		opt.epsSdp = 1e-12;
	}
	if (opt.maxCycles === undefined) {
		opt.maxCycles = 10000;
	}
	if (opt.nbCycles === undefined) {
		opt.nbCycles = -1;
	}
	if (opt.outputPortfolioVolatility === undefined) {
		opt.outputPortfolioVolatility = false;
	}
	if (opt.coordinatesSampler === undefined) {
		opt.coordinatesSampler = 'cyclic';
	}
	
	// Decode the options
	var eps = opt.eps;
	var epsSdp = opt.epsSdp;
	var maxCycles = opt.maxCycles;
	var nbCycles = opt.nbCycles;
	
	var outputPortfolioVolatility = opt.outputPortfolioVolatility; 
	
	var coordinatesSampler;
	if (opt.coordinatesSampler === 'cyclic') {
		coordinatesSampler = cyclicCoordinatesSampler;
	}
	else if (opt.coordinatesSampler === 'shuffledCyclic') {
		coordinatesSampler = shuffledCyclicCoordinatesSampler;
	}	
	else if (opt.coordinatesSampler === 'randomized') {
		coordinatesSampler = randomizedCoordinatesSampler;
	}
	else if (opt.coordinatesSampler === 'acf') {
		coordinatesSampler = adaptiveCoordinateFrequenciesSampler;
	}
	else {
		throw new Error('unsupported coordinates sampler');
	}
	
	// Decode the lower/upper bounds constraints, if provided
	var lowerBounds = null;
	var upperBounds = null;
	if (opt.constraints.minWeights) {
		lowerBounds = opt.constraints.minWeights; // no input checks
		
		if (!opt.constraints.maxWeights) {
			upperBounds = typeof Float64Array === 'function' ? new Float64Array(opt.constraints.minWeights.length) : new Array(opt.constraints.minWeights.length);
			
			// Initialization to an array of ones
			for (var i = 0; i < upperBounds.length; ++i) {
				upperBounds[i] = 1;
			}
		}
	}
	if (opt.constraints.maxWeights) {
		upperBounds = opt.constraints.maxWeights; // no input checks
		
		if (!opt.constraints.minWeights) {
			lowerBounds = typeof Float64Array === 'function' ? new Float64Array(opt.constraints.maxWeights.length) : new Array(opt.constraints.maxWeights.length);

			// Initialization to an array of zeros
			for (var i = 0; i < lowerBounds.length; ++i) {
				lowerBounds[i] = 0;
			}
		}
	}


	// Convert sigma to matrix format
	var sigma = new Matrix_(sigma);
	
	// Convert rb to vector format
	var rb = new Matrix_(rb);

	// TODO: Checks, if enabled
	// Check that diagonal entries of sigma are strictly positive
	// Check that sigma is symmetric and positive definite
	// Check that rb contains strictly positive numbers summing to one
	// Check that sigma and rb are rows compatible


	// ------

	// Initializations
	var nbAssets = sigma.nbRows;
	
	
	// ------
	
	
	// Compute the weights of the unconstrained risk budgeting portfolio, which
	// are needed even in case weights constraints are provided.
	//
	// This is done using any value of the lambda penalty parameter (below, 1)
	// and then normalizing the computed weights, c.f. the second reference.
	var lambda = 1;
	var weightsURb = coordinatesDescentSolve(lambda);
	weightsURb = weightsURb.normalize();
	
	
	// In case weights constraints are provided, the associated restricted simplex is first  
	// checked for emptiness, and the bisection algorithm described in the sixth reference is 
	// then used to compute the weights of the constrained risk budgeting portfolio.
	//
	// Otherwise, there is nothing else to do.
	var x;
	if (lowerBounds || upperBounds) {
		// In case the restricted simplex is empty, an exception is thrown, so that
		// the process is (violently) stopped here.
		var sumBounds = simplexEmptinessCheck_(nbAssets, lowerBounds, upperBounds);
		

		// Compute the initial interval for the bisection algorithm,
		// c.f. remark 7 of the sixth reference.
		var volURb = computeVolatility(weightsURb, Matrix_.xy(sigma, weightsURb));
		var a = 0.5 * volURb;
		var b = 2 * volURb;
		
		
		// Compute the value of the penalty parameter lambda^* such that
		// sum x(lambda^*)_i = 1, i=1..nbAssets, using the bisection algorithm.
		var lambda_star = bisection_(function (lambda) { 
						 		         var weights = coordinatesDescentSolve(lambda, lowerBounds, upperBounds); 
								         return weights.sum() - 1; 
							         }, 
							         a, b);
		
		
		// Compute the associated portfolio weights
		x = coordinatesDescentSolve(lambda_star, lowerBounds, upperBounds);
		
	}
	else {
		// The solution to the unconstrained risk budgeting optimization problem
		// has already been computed.
		x = weightsURb;
	}


	// Depending on what is requested in output, return the computed portfolio weights
	// and possibly the associated portfolio volatility.
	if (outputPortfolioVolatility === true) {
		return [x.toArray(), computeVolatility(x, Matrix_.xy(sigma, x))];
	}
	else {
		return x.toArray();
	}
}
/**
 * @file Footer
 * @author Roman Rubsamen <roman.rubsamen@gmail.com>
 */

/* Start Not to be used as is in Google Sheets */
   return self;
  
})(PortfolioAllocation || {});

 
if (typeof module !== 'undefined') {
  module.exports = PortfolioAllocation;
}

/* End Not to be used as is in Google Sheets */
