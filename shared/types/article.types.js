"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerationTone = exports.PublicationSection = exports.ArticleStatus = void 0;
var ArticleStatus;
(function (ArticleStatus) {
    ArticleStatus["DRAFT"] = "DRAFT";
    ArticleStatus["IN_REVIEW"] = "IN_REVIEW";
    ArticleStatus["READY_TO_PUBLISH"] = "READY_TO_PUBLISH";
    ArticleStatus["SCHEDULED"] = "SCHEDULED";
    ArticleStatus["PUBLISHED"] = "PUBLISHED";
    ArticleStatus["ARCHIVED"] = "ARCHIVED";
})(ArticleStatus || (exports.ArticleStatus = ArticleStatus = {}));
var PublicationSection;
(function (PublicationSection) {
    PublicationSection["ACTUALIZACIONES_NORMATIVAS"] = "ACTUALIZACIONES_NORMATIVAS";
    PublicationSection["JURISPRUDENCIA"] = "JURISPRUDENCIA";
    PublicationSection["ANALISIS_PRACTICO"] = "ANALISIS_PRACTICO";
    PublicationSection["DOCTRINA"] = "DOCTRINA";
    PublicationSection["MAS_RECIENTES"] = "MAS_RECIENTES";
})(PublicationSection || (exports.PublicationSection = PublicationSection = {}));
var GenerationTone;
(function (GenerationTone) {
    GenerationTone["PROFESSIONAL"] = "PROFESSIONAL";
    GenerationTone["ACADEMIC"] = "ACADEMIC";
    GenerationTone["ACCESSIBLE"] = "ACCESSIBLE";
})(GenerationTone || (exports.GenerationTone = GenerationTone = {}));
//# sourceMappingURL=article.types.js.map