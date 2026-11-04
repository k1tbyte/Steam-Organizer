<script setup lang="ts">
import { useAutofillHost, type VaultHostServe } from '#features/autofill'
import { useAutoLock, useVaultSession } from '#features/vault'

const props = defineProps<{ serve: VaultHostServe }>()

// One more page of the session, never shown: it restores the kept session, locks with the other pages, and holds
// the lock policy's deadline with no app tab or popup open.
void useVaultSession().load()
useAutofillHost(props.serve, useAutoLock({ hidden: true }))
</script>

<!-- Renders nothing: it only answers the content script. -->
<template />
