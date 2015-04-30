allowed_data_sets = c("gene_exp_data_set", "diff_exp_data_set")

showKnit <- function(obj) {
	obj$showKnit()
}

showLog <- function(obj) {
    obj$log
}

showName <- function(obj) {
    obj$name
}

showClass <- function(obj) {
    class(obj)
}

add_log <- function(log, to_add) {
    paste(c(log, to_add), collapse="\n")
}

definition <- function(object) {
    value = object
    if (is.character(value)) {
        value = paste(c("\"", value, "\""), collapse="")
    }
    paste(c(deparse(substitute(object)), " = " , value), collapse="")
}

GeneExpressionDataSet <- setRefClass(
	"GeneExpressionDataSet",
	fields = list(
		exp = "matrix",
        annotation = "data.frame",
        log_scale = "logical",
        normalize = "logical",
        log = "character",
        prediction = "list",
        name = "character"
	),
	methods = list(
		initialize = function(exp, annotation, log_scale, normalize, log, prediction, name) {
			exp <<- exp
			annotation <<- annotation
            log_scale <<- log_scale
            normalize <<- normalize
            log <<- log
            prediction <<- prediction
            name <<- name
		},
        heat_map = function(anno, n=NULL, k=NULL) {
            library(preprocessCore)
	
	        prediction <- configure_construct_heat_map_exec()
            if (!is.null(n) && !(n == prediction$n)) print("wrong prediction n") #SOME LOGGING HERE
            if (is.null(n)) n = prediction$n
	        if (!is.null(k) && !(n == prediction$k)) print("wrong prediction k") #SOME LOGGING HERE
            if (is.null(k)) k = prediction$k   
	
            to_exec = c(
                definition(n), definition(k), definition(anno),
                "gene.exp.norm <- exp[sample(seq_len(nrow(exp))), ]",
                "gene.exp.tscore <- tScore(gene.exp.norm)",
                "gene.exp.mean <- apply(gene.exp.norm, 1, mean)",
                "gene.exp.top <- gene.exp.tscore[head(order(gene.exp.mean, decreasing = T), n=n), ]",
                "km <- kmeans(gene.exp.top, k)",
                "data <- gene.exp.top[order(km$cluster), ]",
                "selected_annotation = subset(annotation, select=c(anno))"
            )
            eval(parse(text=to_exec))
	        HeatMap(data, selected_annotation, add_log(log, to_exec), prediction)
        },
        differential_expression = function(selected_annotation, state1, state2) {
            state1 = strsplit(state1, " ")[[1]][3]
            state2 = strsplit(state2, " ")[[1]][3]
            to_exec = c(
                "library(limma)",
                definition(selected_annotation), definition(state1), definition(state2),
                "design <- model.matrix(eval(parse(text=sprintf(\"~0+%s\", selected_annotation))), data=annotation)",
                "fit <- lmFit(exp, design)",
                "selected_contrasts <- sprintf(\"%s%s-%s%s\", selected_annotation, state1, selected_annotation, state2)",
                "eval(parse(text=sprintf(\"make_contrasts <- makeContrasts(%s, levels=design)\", selected_contrasts)))",
                "fit2 <- contrasts.fit(fit, make_contrasts)",
                "fit2 <- eBayes(fit2)",
                "diff_exp <- topTable(fit2, adjust.method=\"BH\", number=Inf)",
                "write.table(diff_exp, file='diff_expression.tsv', quote=FALSE, sep='\t', col.names = NA)"
            )
            code = paste(to_exec, collapse="\n")
            eval(parse(text=to_exec))
            name = sprintf("Differential Expression Data Set %s at %s", selected_contrasts, Sys.time())
            DifferentialExpression(diff_exp, add_log(log, code), name)
        },
		showKnit = function() {
			library(knitr)
			opts_knit$set(width=120)
			strings = c(
			"<div class='r-container'>",
		        "Current dataset contains",
		        "<!--rinline nrow(exp) -->",
			"rows, featuring these samples: ",
			"<!--rinline colnames(exp) -->",
            "<br>Dataset log-scaled",
            "<!--rinline log_scale -->",
            "<br>Dataset normalized",
            "<!--rinline normalize -->",
		        "</div>")
			string = paste(strings, collapse="")
			val = knit2html(text=string, fragment.only=TRUE)
			val
		},
		redo = function(exp_file, anno_file, log_scale, normalize) {
		    build_gene_exp(prediction, exp_file, anno_file, log_scale, normalize)
		}
	)
)

gene_exp_data_set <- vector(mode="list", length=4)
names(gene_exp_data_set) <- c("class", "name", "constructor", "methods")
gene_exp_data_set$class <- "GeneExpressionDataSet"
gene_exp_data_set$name  <- "Gene Expression Data Set"
gene_exp_data_set$constructor <- "construct_gene_exp"
gene_exp_data_set$methods <- "gene_exp_methods"

gene_exp_methods <- function(dataset) {
    methods <- vector(mode="list", length=3)
    names(methods) <- c("heat_map", "redo", "differential_expression")

    methods$heat_map <- vector(mode="list", length=4)
    names(methods$heat_map) <- c("exec", "description", "args", "modificator")
    methods$heat_map$exec = "gene_exp_heat_map"
    methods$heat_map$description = "Build the heatmap"
    methods$heat_map$modificator = FALSE
    methods$heat_map$args <- vector(mode="list", length=3)
    names(methods$heat_map$args) <- c("anno", "n", "k")
    annotation_prediction = configure_heat_map_annotation(topk(dataset$exp, 10000, 10), dataset$annotation)
    methods$heat_map$args$anno = list(
        name="anno", description="Annotation to use",
        type="select",
        choices=colnames(dataset$annotation),
        default=annotation_prediction,
        required=TRUE
    )
    methods$heat_map$args$n = list(
        name="n", description="Top count",
        type="integer",
        default=10000,
        required=FALSE
    )
    methods$heat_map$args$k = list(
        name="k", description="k in kmeans",
        type="integer",
        default=10,
        required=FALSE
    )

    methods$redo <- vector(mode="list", length=4)
    names(methods$redo) <- c("exec", "description", "args", "modificator")
    methods$redo$exec = "gene_exp_redo"
    methods$redo$description = "Rebuild gene expression dataset"
    methods$redo$modificator = TRUE
    methods$redo$args <- vector(mode="list", length=4)
    names(methods$redo$args) <- c("exp_file", "anno_file", "log_scale", "normalize")
    methods$redo$args$exp_file <- list(
        name="exp_file", description="Gene expression tsv file",
        type="file",
        required=TRUE
    )
    methods$redo$args$anno_file <- list(
        name="anno_file", description="Annotation tsv file",
        type="file",
        required=TRUE
    )
    methods$redo$args$log_scale <- list(
        name="log_scale", description="Log scale the dataset",
        type="boolean",
        default=dataset$log_scale,
        required=TRUE
    )
    methods$redo$args$normalize <- list(
        name="normalize", description="Normalize the dataset",
        type="boolean",
        default=dataset$normalize,
        required=TRUE
    )

    methods$differential_expression <- vector(mode="list", length=4)
    names(methods$differential_expression) <- c("exec", "description", "args", "modificator")
    methods$differential_expression$exec = "gene_exp_differential_expression"
    methods$differential_expression$description = "Build differential expression"
    methods$differential_expression$modificator = TRUE
    methods$differential_expression$args <- vector(mode="list", length=3)
    names(methods$differential_expression$args) <- c("selected_annotation", "state1", "state2")
    methods$differential_expression$args$selected_annotation <- list(
        name="selected_annotation", description="Annotation",
        type="select",
        choices=colnames(dataset$annotation),
        default=annotation_prediction,
        required=TRUE
    )

    cnames = colnames(dataset$annotation)

    res = c()
    for (name in cnames) {
        uniques = unname(as.list(unique(subset(dataset$annotation, select=c(name)))))
        choices = Map((function(x) paste(c(paste(name, ":")), x, sep=" ")), uniques)
        res = c(res, choices, recursive=TRUE)
    }



    methods$differential_expression$args$state1 <- list(
        name="state1", description="state1",
        type="select",
        choices=res,
        required=TRUE
    )
    methods$differential_expression$args$state2 <- list(
        name="state2", description="state2",
        type="select",
        choices=res,
        required=TRUE
    )

    methods
}

gene_exp_heat_map <- function(dataset, anno, n, k) {
    dataset$heat_map(anno, n, k)
}

gene_exp_redo <- function(dataset, exp_file, anno_file, log_scale, normalize) {
    dataset$redo(exp_file, anno_file, log_scale, normalize)
}

gene_exp_differential_expression <- function(dataset, selected_annotation, state1, state2) {
    dataset$differential_expression(selected_annotation, state1, state2)
}


predict_construct_gene_exp <- function(exp_file) {
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

build_gene_exp <- function(prediction, exp_file, anno_file, log_scale=NULL, normalize=NULL) {
    if (!is.null(log_scale) && !(log_scale == prediction$log_scale)) print("wrong prediction log_scale") #SOME LOGGING HERE
    if (is.null(log_scale)) log_scale = prediction$log_scale
    if (!is.null(normalize) && !(normalize == prediction$normalize)) print("wrong prediction normalize") #SOME LOGGING HERE
    if (is.null(normalize)) normalize = prediction$normalize

    to_exec = c(
        "library(preprocessCore)",
        definition(exp_file), definition(anno_file),
        "#reading data",
        "exp <- as.matrix(read.table(exp_file, header=1, row.names=1))",
        "annotation <- as.data.frame(read.table(anno_file, header=1, row.names=1))"
    )
    if (log_scale) {
        to_exec = c(to_exec,
            "#log scaling",
            "exp <- log2(exp + 1)"
        )
    }
    if (normalize) {
        to_exec = c(to_exec,
            "#normalizing",
            "exp.norm <- normalize.quantiles(exp)",
            "colnames(exp.norm) = colnames(exp)",
            "rownames(exp.norm) = rownames(exp)",
            "exp <- exp.norm"
        )
    }
    name = sprintf("Gene Expression Data Set %s / %s at %s", exp_file, anno_file, Sys.time())
    code = paste(to_exec, collapse="\n")
    eval(parse(text=code))
	GeneExpressionDataSet(exp, annotation, log_scale, normalize, code, prediction, name)
}

construct_gene_exp_exec <- function(exp_file, anno_file) {
	prediction <- predict_construct_gene_exp(exp_file)
    build_gene_exp(prediction, exp_file, anno_file, prediction$log_scale, prediction$normalize)
}

construct_gene_exp <- function() {
    result <- vector(mode="list", length=2)
    names(result) <- c("exec", "args")
    result$exec <- "construct_gene_exp_exec"
    result$args <- vector(mode="list", length=2)
    names(result$args) <- c("exp_file", "anno_file")
    result$args$exp_file <- list(
        name="exp_file",
        description="Gene expression tsv file",
        type="file",
        required=TRUE
    )
    result$args$anno_file <- list(
        name="anno_file",
        description="Annotation tsv file",
        type="file",
        required=TRUE
    )
    result
}



HeatMap <- setRefClass(
	"HeatMap",
	fields = list(
		data = "matrix",
		selected_annotation = "data.frame",
        log = "character",
        prediction = "list"
	),
	methods = list(
		initialize = function(data, annotation, log, prediction) {
			data <<- data
			selected_annotation <<- annotation
            log <<- add_log(log, paste(c("library(pheatmap)", "pheatmap(data, annotation=selected_annotation, cluster_rows = F,  show_rownames=F)"), collapse="\n"))
            prediction <<- prediction
		},
		showKnit = function() {
			library(knitr)
			library(pheatmap)
			strings = c(
			"<!--begin.rcode",
			"pheatmap(data, annotation=selected_annotation, cluster_rows = F,  show_rownames=F)",
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


configure_construct_heat_map_exec <- function() {
    ans <- vector(mode="list", length=2)
    names(ans) <- c("n", "k")
	ans$n <- 10000
	ans$k <- 10
	ans
}

check_in_cluster <- function(clustering, str, i) {
	left = FALSE
	if (clustering$merge[i, 1] < 0) {
		left = (str == clustering$labels[-clustering$merge[i, 1] ])
	} else {
		left = check_in_cluster(clustering, str, clustering$merge[i, 1])
	}
	right = FALSE
	if (clustering$merge[i, 2] < 0) {
		right = (str == clustering$labels[-clustering$merge[i, 2] ])
	} else {
		right = check_in_cluster(clustering, str, clustering$merge[i, 2])
	}
	return(left || right)
}


annotation_is_good <-function(data, annotation) {
	mat = t(data)
	d = dist(mat, method="euclidean")
	clustering = hclust(d, method="complete")
	groups = unique(annotation)
	good = TRUE
	for (i in nrow(groups)) {
		bad = TRUE
		group = groups[i, 1]
		anno_name = colnames(annotation)[1]
		seqs = annotation[annotation[, anno_name]==group, ,drop=FALSE]
		for (cluster in 1:nrow(clustering$merge)) {
			cluster_exists = TRUE
			for (seq in rownames(annotation)) {
				if ((seq %in% rownames(seqs)) != check_in_cluster(clustering, seq, cluster)) {
					cluster_exists = FALSE
				}
			}
			if (cluster_exists) bad = FALSE
		}
		if (bad) {
			good = FALSE
		}	
	}
	return(good)
}

configure_heat_map_annotation <- function(data, annotation) {
	good = NULL
	for (name in colnames(annotation)) {
		annotation_frame = subset(annotation, select=c(name))
		if (annotation_is_good(data, annotation_frame)) {
			good = name
			print(name)
		}
	}
	if (is.null(good)) good = colnames(annotation)[1]
	return(good)
}


topk <- function(exp, n, k) {
    gene.exp.norm <- exp[sample(seq_len(nrow(exp))), ]
    gene.exp.tscore <- tScore(gene.exp.norm)
    gene.exp.mean <- apply(gene.exp.norm, 1, mean)
    gene.exp.top <- gene.exp.tscore[head(order(gene.exp.mean, decreasing = T), n=n), ]
    km <- kmeans(gene.exp.top, k)
    gene.exp.top <- gene.exp.top[order(km$cluster), ]
}


DifferentialExpression <- setRefClass(
	"DifferentialExpression",
	fields = list(
		diff_exp = "data.frame",
		log = "character",
		name = "character"
	),
	methods = list(
		initialize = function(diff_exp, log, name) {
			diff_exp <<- diff_exp
			log <<- log
			name <<- name
		},
		showKnit = function() {
		    library(knitr)
		    opts_knit$set(width=120)
			strings = c(
			"<!--begin.rcode",
			"head(diff_exp, 20)",
			"end.rcode-->"
			)
			string = paste(strings, collapse="\n")
			val = knit2html(text=string, fragment.only=TRUE)
			val
		},
		topValues = function(n, order_property) {
		    to_exec = c(
		        definition(n), definition(order_property),
		        "stat = head(diff_exp[with(diff_exp, order(eval(parse(text=order_property)))), ], n)"
		    )
		    code = paste(to_exec, collapse="\n")
            eval(parse(text=to_exec))
            Stat(stat, add_log(log, code))

		},
        getEntrezNames = function() {
            to_exec = c(
                "library(data.table)",
                "load(system.file(\"reflink.rda\", package=\"GeneExprDataSet\"))",
                "diff_exp$symbol <- reflink[match(rownames(diff_exp), reflink$Entrez), \"symbol\"]"
            )
            code = paste(to_exec, collapse="\n")
            eval(parse(text=code))
            DifferentialExpression(diff_exp, add_log(log, code))
        },
		perform = function() {
			head(diff_exp, 20)
		}
	)
)

diff_exp_data_set <- vector(mode="list", length=3)
names(diff_exp_data_set) <- c("class", "name", "methods")
diff_exp_data_set$class <- "DifferentialExpression"
diff_exp_data_set$name  <- "Differential Expression Data Set"
diff_exp_data_set$methods <- "diff_exp_methods"

diff_exp_methods <- function(dataset) {
    methods <- vector(mode="list", length=2)
    names(methods) <- c("topValues", "getEntrezNames")

    methods$topValues <- vector(mode="list", length=4)
    names(methods$topValues) <- c("exec", "description", "args", "modificator")
    methods$topValues$exec = "diff_exp_top_values"
    methods$topValues$description = "Look for top values"
    methods$topValues$modificator = FALSE
    methods$topValues$args <- vector(mode="list", length=2)
    names(methods$topValues$args) <- c("n", "order_property")
    methods$topValues$args$n <- list(
        name="n", description="top count",
        type="integer",
        default=20,
        required=TRUE
    )

    cnames = colnames(dataset$diff_exp)
    choices = c(Map((function(x) paste(c("+"), x, sep="")), cnames), Map((function(x) paste(c("-"), x, sep="")), cnames))
    choices = as.character(choices)

    methods$topValues$args$order_property <- list(
        name="order_property", description="column to order",
        type="select",
        choices=choices,
        default=choices[1],
        required=TRUE
    )

    methods$getEntrezNames <- vector(mode="list", length=4)
    names(methods$getEntrezNames) <- c("exec", "description", "args", "modificator")
    methods$getEntrezNames$exec = "diff_exp_get_entrez"
    methods$getEntrezNames$description = "Get Entrez annotation"
    methods$getEntrezNames$modificator = TRUE
    methods$getEntrezNames$args <- vector(mode="list", length=0)

    methods
}

diff_exp_get_entrez <- function (dataset) {
    dataset$getEntrezNames()
}

diff_exp_top_values <- function (dataset, n, order_property) {
    dataset$topValues(n, order_property)
}

Stat <- setRefClass(
	"Stat",
	fields = list(
		stat = "data.frame",
		log = "character"
	),
	methods = list(
		initialize = function(stat, log) {
			stat <<- stat
			log <<- add_log(log, "stat")
		},
		showKnit = function() {
		    library(knitr)
		    opts_knit$set(width=120)
			strings = c(
			"<!--begin.rcode",
			"stat",
			"end.rcode-->"
			)
			string = paste(strings, collapse="\n")
			val = knit2html(text=string, fragment.only=TRUE)
			val
		}
	)
)
