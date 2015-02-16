allowed_data_sets = c("gene_exp_data_set")

showKnit <- function(obj) {
	obj$showKnit()
}

GeneExpressionDataSet <- setRefClass(
	"GeneExpressionDataSet",
	fields = list(
		exp = "matrix"
	),
	methods = list(
		initialize = function(exp) {
			exp <<- exp
		},
		showKnit = function() {
			library(knitr)
			strings = c(
			"<div class='r-container'>",
		        "Current dataset contains",
		        "<!--rinline nrow(exp) -->",
			"raws, featuring this genes",
			"<!--rinline colnames(exp) -->",
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


construct_gene_exp_exec <- function(file) {
	exp <- as.matrix(read.table(file, header=1, row.names=1))
	GeneExpressionDataSet(exp)
}
construct_gene_exp <- vector(mode="list", length=2)
names(construct_gene_exp) <- c("exec", "args")
construct_gene_exp$exec <- "construct_gene_exp_exec"
construct_gene_exp$args <- vector(mode="list", length=1)
names(construct_gene_exp$args) <- c("file")
construct_gene_exp$args$file <- list(name="file", description="tsv file", type="file", required=TRUE)


HeatMap <- setRefClass(
	"HeatMap",
	fields = list(
		data = "matrix"
	),
	methods = list(
		initialize = function(data) {
			data <<- data
		},
		showKnit = function() {
			library(knitr)
			library(pheatmap)
			strings = c(
			"<!--begin.rcode",
			"pheatmap(data, cluster_rows = F, show_rownames = F)",
			"end.rcode-->"
			)
			string = paste(strings, collapse="\n")
			val = knit2html(text=string, fragment.only=TRUE)
			val
		}
	)
)




tScore <- function(x) {
    x.min <- apply(x, 1, min)
    x.max <- apply(x, 1, max)    
    
    res <- sweep(sweep(x, 1, x.min), 1, x.max - x.min + 1e-9, "/")    
    return(res)
}

construct_heat_map_exec <- function(dataset, n=10000, k=5) {
	library(preprocessCore)
	gene.exp.norm <- normalize.quantiles(log2(dataset$exp + 1))
	gene.exp.norm <- gene.exp.norm[sample(seq_len(nrow(gene.exp.norm))), ]
	gene.exp.tscore <- tScore(gene.exp.norm)

	gene.exp.mean <- apply(gene.exp.norm, 1, mean)
	gene.exp.top <- gene.exp.tscore[head(order(gene.exp.mean, decreasing = T), n=n), ]

	km <- kmeans(gene.exp.top, k)
	gene.exp.top <- gene.exp.top[order(km$cluster), ]
	HeatMap(gene.exp.top)
}

construct_heat_map <- vector(mode="list", length=2)
names(construct_heat_map) <- c("exec", "args")
construct_heat_map$exec <- "construct_heat_map_exec"
construct_heat_map$args <- vector(mode="list", length=3)
names(construct_heat_map$args) <- c("dataset", "n", "k")
construct_heat_map$args$dataset <- list(name="dataset", description="dataset", type="dataset", required=TRUE)
construct_heat_map$args$n <- list(name="n", description="top count", type="number", required=FALSE, default=10000)
construct_heat_map$args$k <- list(name="k", description="kmean dimension", type="number", required=FALSE, default=5)
