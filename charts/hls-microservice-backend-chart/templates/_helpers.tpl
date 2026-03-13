{{- define "hls.name" -}}
{{- default "hls-microservice-backend" .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "hls.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name (include "hls.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "hls.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "hls.commonLabels" -}}
helm.sh/chart: {{ include "hls.chart" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- with .Values.global.commonLabels }}
{{ toYaml . }}
{{- end }}
{{- end -}}

{{- define "hls.selectorLabels" -}}
app.kubernetes.io/name: {{ include "hls.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "hls.componentSelectorLabels" -}}
{{- $root := .root -}}
{{ include "hls.selectorLabels" $root }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}

{{- define "hls.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (printf "%s-sa" (include "hls.fullname" .)) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{- define "hls.configmapName" -}}
{{- printf "%s-config" (include "hls.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "hls.secretName" -}}
{{- if .Values.secret.existingSecret -}}
{{- .Values.secret.existingSecret -}}
{{- else -}}
{{- printf "%s-secret" (include "hls.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "hls.pvcName" -}}
{{- if .Values.persistence.existingClaim -}}
{{- .Values.persistence.existingClaim -}}
{{- else -}}
{{- printf "%s-media" (include "hls.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "hls.main.fullname" -}}
{{- printf "%s-main" (include "hls.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "hls.worker.fullname" -}}
{{- printf "%s-video-processor" (include "hls.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "hls.static.fullname" -}}
{{- printf "%s-hls-static" (include "hls.fullname" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
