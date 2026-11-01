# Verifica que Node.js esté disponible para cargar la configuración
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js no se encuentra en el PATH."
    exit 1
}

# Verifica que mongodump esté disponible
if (-not (Get-Command mongodump -ErrorAction SilentlyContinue)) {
    Write-Error "mongodump no se encuentra en el PATH."
    exit 1
}

# Carga el .env del proyecto y respeta las variables de entorno existentes
$configScript = Join-Path $PSScriptRoot "cargar-config-backup.js"
$configJson = & node $configScript
$configExitCode = $LASTEXITCODE

if ($configExitCode -ne 0) {
    exit $configExitCode
}

try {
    $configuracion = ($configJson -join [Environment]::NewLine) |
        ConvertFrom-Json -ErrorAction Stop

    if (-not $configuracion.uri -or -not $configuracion.databaseName) {
        throw "La configuración del respaldo está incompleta."
    }
} catch {
    Write-Error "No se pudo obtener la configuración del respaldo."
    exit 1
}

$mongoUri = $configuracion.uri
$databaseName = $configuracion.databaseName

# Agrupa por fecha y distingue cada respaldo por hora, minutos y segundos
$momentoRespaldo = Get-Date
$fecha = $momentoRespaldo.ToString("yyyy-MM-dd")
$hora = $momentoRespaldo.ToString("HH-mm-ss")

# Ruta relativa al directorio donde se encuentra este script
$resguardosPath = Join-Path $PSScriptRoot "resguardos_tpi"
$diaPath = Join-Path $resguardosPath $fecha
$backupPath = Join-Path $diaPath $hora

# Si dos respaldos coinciden en el mismo segundo, usa un sufijo
$numeroRespaldo = 1
while (Test-Path -LiteralPath $backupPath) {
    $backupPath = Join-Path $diaPath "$hora-$numeroRespaldo"
    $numeroRespaldo++
}

try {
    New-Item -ItemType Directory -Path $resguardosPath -Force -ErrorAction Stop | Out-Null
    New-Item -ItemType Directory -Path $diaPath -Force -ErrorAction Stop | Out-Null
    New-Item -ItemType Directory -Path $backupPath -ErrorAction Stop | Out-Null
} catch {
    Write-Error "No se pudo crear la carpeta del respaldo."
    exit 1
}

Write-Host "Iniciando respaldo de la base '$databaseName'..."
Write-Host "Destino: $backupPath"

# Ejecuta mongodump contra MongoDB Atlas
mongodump `
    --uri="$mongoUri" `
    --db="$databaseName" `
    --out="$backupPath"

$backupExitCode = $LASTEXITCODE

# Verifica el resultado
if ($backupExitCode -eq 0) {
    Write-Host "Respaldo realizado correctamente."
} else {
    Write-Error "Se produjo un error durante el respaldo."
    exit $backupExitCode
}
