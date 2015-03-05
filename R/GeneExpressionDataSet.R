allowed_data_sets = c("gene_exp_data_set")

showKnit <- function(obj) {
	obj$showKnit()
}

GeneExpressionDataSet <- setRefClass(
	"GeneExpressionDataSet",
	fields = list(
		exp = "matrix",
        annotation = "data.frame",
        log_scale = "logical",
        normalize = "logical"
	),
	methods = list(
		initialize = function(exp, annotation, log_scale, normalize) {
			exp <<- exp
			annotation <<- annotation
            log_scale <<- log_scale
            normalize <<- normalize
		},
		showKnit = function() {
			library(knitr)
			strings = c(
			"<div class='r-container'>",
		        "Current dataset contains",
		        "<!--rinline nrow(exp) -->",
			"raws, featuring this genes",
			"<!--rinline colnames(exp) -->",
            "Dataset log-scaled",
            "<!--rinline log_scale -->",
            "Dataset normalized",
            "<!--rinline normalize -->",
		        "</div>")
			string = paste(strings, collapse="")
			val = knit2html(text=string, fragment.only=TRUE)
			val
		}
	)
)

gene_exp_data_set <- vector(mode="list", length=5)
names(gene_exp_data_set) <- c("class", "name", "constructor", "mods", "methods")
gene_exp_data_set$class <- "GeneExpressionDataSet"
gene_exp_data_set$name  <- "Gene Expression Data Set"
gene_exp_data_set$constructor <- "construct_gene_exp"
gene_exp_data_set$methods <- c("construct_heat_map")


configure_construct_gene_exp_exec <- function(exp_file) {
    library(preprocessCore)
    exp <- as.matrix(read.table(exp_file, header=1, row.names=1))
    ans <- vector(mode="list", length=2)
    names(ans) <- c("log_scale", "normalize")
    
    diff <- max(exp) - min(exp)
    if ((diff < 1) || (diff > 30)) {
        ans$log_scale = TRUE
    } else {
        ans$log_scale = FALSE
    }

    exp.sorted <- apply(exp, 2, sort, decreasing=F)
    exp.sorted.norm <- normalize.quantiles(exp.sorted)
    mean_before = mean(apply(exp.sorted, 1, sd))
    mean_after = mean(apply(exp.sorted.norm, 1, sd))
    if (mean_before / mean_after > 10) {
        ans$normalize = TRUE
    } else {
        ans$normalize = FALSE
    }
    ans
}

construct_gene_exp_exec <- function(exp_file, anno_file, log_scale=NULL, normalize=NULL) {
    library(preprocessCore)
	prediction <- configure_construct_gene_exp_exec(exp_file)
    if (!is.null(log_scale) && !(log_scale == prediction$log_scale)) print("wrong prediction log_scale") #SOME LOGGING HERE
    if (is.null(log_scale)) log_scale = prediction$log_scale
    if (!is.null(normalize) && !(normalize == prediction$normalize)) print("wrong prediction normalize") #SOME LOGGING HERE
    if (is.null(normalize)) normalize = prediction$normalize   

    exp <- as.matrix(read.table(exp_file, header=1, row.names=1))
    annotation <- as.data.frame(read.table(anno_file, header=1, row.names=1))
    if (log_scale) {
        exp <- log2(exp + 1)
    }
    if (normalize) {
        exp.norm <- normalize.quantiles(exp)
        colnames(exp.norm) = colnames(exp)
        rownames(exp.norm) = rownames(exp.norm)
        exp <- exp.norm
    }
	GeneExpressionDataSet(exp, annotation, log_scale, normalize)
}

construct_gene_exp <- vector(mode="list", length=2)
names(construct_gene_exp) <- c("exec", "args")
construct_gene_exp$exec <- "construct_gene_exp_exec"
construct_gene_exp$args <- vector(mode="list", length=4)
names(construct_gene_exp$args) <- c("exp_file", "anno_file", "log_scale", "normalize")
construct_gene_exp$args$exp_file <- list(name="exp_file", description="tsv file", type="file", required=TRUE)
construct_gene_exp$args$anno_file <- list(name="anno_file", description="tsv file", type="file", required=TRUE)
construct_gene_exp$args$log_scale <-list(name="log_scale", description="we can do log_scale for you", type="boolean", required=FALSE)
construct_gene_exp$args$normalize <-list(name="normalize", description="we can do quantile normalization for you", type="boolean", required=FALSE)


HeatMap <- setRefClass(
	"HeatMap",
	fields = list(
		data = "matrix",
		annotation = "data.frame"
	),
	methods = list(
		initialize = function(data, annotation) {
			data <<- data
			annotation <<- annotation
		},
		showKnit = function() {
			library(knitr)
			library(pheatmap)
			strings = c(
			"<!--begin.rcode",
			"pheatmap(data, annotation=annotation, cluster_rows = F)",
			"end.rcode-->"
			)
			string = paste(strings, collapse="\n")
			val = knit2html(text=string, fragment.only=TRUE)
			val
		},
		perform = function() {
			library(pheatmap)
			pheatmap(data, annotation=annotation, cluster_rows=F)
		}
	)
)




tScore <- function(x) {
    x.min <- apply(x, 1, min)
    x.max <- apply(x, 1, max)    
    
    res <- sweep(sweep(x, 1, x.min), 1, x.max - x.min + 1e-9, "/")    
    return(res)
}


configure_construct_heat_map_exec <- function(dataset) {
    ans <- vector(mode="list", length=3)
    names(ans) <- c("annotation", "n", "k")
	ans$annotation <- colnames(dataset$annotation)[1]
	ans$n <- 10000
	ans$k <- 10
	ans
}

construct_heat_map_exec <- function(dataset, annotation=NULL, n=NULL, k=NULL) {
    library(preprocessCore)
	
	prediction <- configure_construct_heat_map_exec(dataset)
	if (!is.null(annotation) && !(annotation == prediction$annotation)) print("wrong prediction annotaion") #SOME LOGGING HERE
    if (is.null(annotation)) annotation = prediction$annotation
    if (!is.null(n) && !(n == prediction$n)) print("wrong prediction n") #SOME LOGGING HERE
    if (is.null(n)) n = prediction$n
	if (!is.null(k) && !(n == prediction$k)) print("wrong prediction k") #SOME LOGGING HERE
    if (is.null(k)) k = prediction$k   
	
	gene.exp.norm <- dataset$exp[sample(seq_len(nrow(dataset$exp))), ]
	gene.exp.tscore <- tScore(gene.exp.norm)

	gene.exp.mean <- apply(gene.exp.norm, 1, mean)
	gene.exp.top <- gene.exp.tscore[head(order(gene.exp.mean, decreasing = T), n=n), ]

	km <- kmeans(gene.exp.top, k)
	gene.exp.top <- gene.exp.top[order(km$cluster), ]
	annotation_frame = subset(dataset$annotation, select=c(annotation))
	HeatMap(gene.exp.top, annotation_frame)
}

construct_heat_map <- vector(mode="list", length=2)
names(construct_heat_map) <- c("exec", "args")
construct_heat_map$exec <- "construct_heat_map_exec"
construct_heat_map$args <- vector(mode="list", length=4)
names(construct_heat_map$args) <- c("dataset", "annotation", "n", "k")
construct_heat_map$args$dataset <- list(name="dataset", description="dataset", type="dataset", required=TRUE)
construct_heat_map$args$annotation <- list(name="annotation", description="annotation", type="character", required=FALSE)
construct_heat_map$args$n <- list(name="n", description="top count", type="number", required=FALSE, default=10000)
construct_heat_map$args$k <- list(name="k", description="kmean dimension", type="number", required=FALSE, default=5)
