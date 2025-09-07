"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAnalysisStatus = exports.Priority = exports.DocumentStatus = exports.DocumentType = exports.LegalArea = exports.DocumentSource = void 0;
// Document-related types
var DocumentSource;
(function (DocumentSource) {
    DocumentSource["BOE"] = "BOE";
    DocumentSource["TRIBUNAL_SUPREMO"] = "TRIBUNAL_SUPREMO";
    DocumentSource["TRIBUNAL_CONSTITUCIONAL"] = "TRIBUNAL_CONSTITUCIONAL";
    DocumentSource["MINISTERIO_JUSTICIA"] = "MINISTERIO_JUSTICIA";
    DocumentSource["CCAA"] = "CCAA";
    DocumentSource["OTROS"] = "OTROS";
})(DocumentSource || (exports.DocumentSource = DocumentSource = {}));
var LegalArea;
(function (LegalArea) {
    LegalArea["CIVIL"] = "CIVIL";
    LegalArea["PENAL"] = "PENAL";
    LegalArea["MERCANTIL"] = "MERCANTIL";
    LegalArea["LABORAL"] = "LABORAL";
    LegalArea["ADMINISTRATIVO"] = "ADMINISTRATIVO";
    LegalArea["FISCAL"] = "FISCAL";
    LegalArea["CONSTITUCIONAL"] = "CONSTITUCIONAL";
})(LegalArea || (exports.LegalArea = LegalArea = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["LEY"] = "LEY";
    DocumentType["REAL_DECRETO"] = "REAL_DECRETO";
    DocumentType["SENTENCIA"] = "SENTENCIA";
    DocumentType["RESOLUCION"] = "RESOLUCION";
    DocumentType["CIRCULAR"] = "CIRCULAR";
    DocumentType["INSTRUCCION"] = "INSTRUCCION";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["PENDING"] = "PENDING";
    DocumentStatus["APPROVED"] = "APPROVED";
    DocumentStatus["REJECTED"] = "REJECTED";
    DocumentStatus["PROCESSING"] = "PROCESSING";
    DocumentStatus["ERROR"] = "ERROR";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
var Priority;
(function (Priority) {
    Priority["LOW"] = "LOW";
    Priority["NORMAL"] = "NORMAL";
    Priority["HIGH"] = "HIGH";
    Priority["URGENT"] = "URGENT";
})(Priority || (exports.Priority = Priority = {}));
var AIAnalysisStatus;
(function (AIAnalysisStatus) {
    AIAnalysisStatus["PENDING"] = "PENDING";
    AIAnalysisStatus["PROCESSING"] = "PROCESSING";
    AIAnalysisStatus["COMPLETED"] = "COMPLETED";
    AIAnalysisStatus["FAILED"] = "FAILED";
})(AIAnalysisStatus || (exports.AIAnalysisStatus = AIAnalysisStatus = {}));
//# sourceMappingURL=document.types.js.map