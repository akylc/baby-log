<template>
  <div class="record">
    <header class="hd">
      <span style="width: 48px"></span>
      <span class="title">记一笔</span>
      <span style="width: 48px"></span>
    </header>

    <div class="type-row">
      <button
        v-for="t in types"
        :key="t.value"
        :class="['type-btn', { active: type === t.value }]"
        @click="type = t.value"
      >
        <span class="ti">{{ t.icon }}</span>{{ t.label }}
      </button>
    </div>

    <section class="form">
      <template v-if="type === 'breast'">
        <div class="field">
          <label>左乳时长（分钟）<span class="req">*</span></label>
          <n-input-number v-model:value="leftDuration" :min="0" :max="240" placeholder="如 15" />
        </div>
        <div class="field">
          <label>右乳时长（分钟）<span class="req">*</span></label>
          <n-input-number v-model:value="rightDuration" :min="0" :max="240" placeholder="如 15" />
        </div>
      </template>

      <template v-else-if="type === 'formula'">
        <div class="field">
          <label>奶量（ml）<span class="req">*</span></label>
          <n-input-number v-model:value="amount" :min="0" :max="500" placeholder="如 120" />
        </div>
      </template>

      <template v-else-if="type === 'bottle'">
        <div class="field">
          <label>奶量（ml）<span class="req">*</span></label>
          <n-input-number v-model:value="amount" :min="0" :max="500" placeholder="如 120" />
        </div>
      </template>

      <template v-else-if="type === 'food'">
        <div class="field">
          <label>辅食名称<span class="req">*</span></label>
          <n-input v-model:value="foodName" placeholder="如 米粉、南瓜泥" />
        </div>
      </template>

      <template v-else-if="type === 'sleep'">
        <div class="field">
          <label>睡眠时长（分钟）<span class="req">*</span></label>
          <n-input-number v-model:value="duration" :min="1" :max="600" placeholder="如 90" />
        </div>
      </template>

      <template v-else-if="type === 'diaper'">
        <div class="field">
          <label>类型</label>
          <div class="seg">
            <button
              v-for="o in diaperOpts"
              :key="o.value"
              :class="['seg-btn', { active: diaperType === o.value }]"
              @click="diaperType = o.value"
            >
              {{ o.label }}
            </button>
          </div>
        </div>
      </template>

      <div class="field">
        <label>时间</label>
        <n-date-picker v-model:value="occurredTs" type="datetime" format="yyyy-MM-dd HH:mm" />
      </div>
      <div class="field">
        <label>备注（可选）</label>
        <n-input
          v-model:value="note"
          type="textarea"
          placeholder="想记点什么…"
          :autosize="{ minRows: 2, maxRows: 4 }"
        />
      </div>

      <n-button type="primary" block size="large" :loading="loading" @click="submit">保存记录</n-button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { useBabyStore } from '@/stores/baby'
import { createFeeding, getLastFeeding } from '@/api/feedings'
import { createSleep } from '@/api/sleeps'
import { createDiaper } from '@/api/diapers'
import { tsToIso } from '@/utils/time'

const router = useRouter()
const message = useMessage()
const babyStore = useBabyStore()
const { baby } = storeToRefs(babyStore)

type RecType = 'breast' | 'formula' | 'food' | 'bottle' | 'sleep' | 'diaper'
const types = [
  { value: 'breast', label: '母乳', icon: '🤱' },
  { value: 'formula', label: '配方奶', icon: '🥛' },
  { value: 'bottle', label: '瓶喂', icon: '🍼' },
  { value: 'food', label: '辅食', icon: '🍚' },
  { value: 'sleep', label: '睡眠', icon: '😴' },
  { value: 'diaper', label: '换尿布', icon: '💩' },
]
const diaperOpts = [
  { value: 'pee', label: '尿' },
  { value: 'poo', label: '便' },
  { value: 'both', label: '尿+便' },
]

const type = ref<RecType>('breast')
const diaperType = ref<'pee' | 'poo' | 'both'>('pee')
const leftDuration = ref<number | null>(null)
const rightDuration = ref<number | null>(null)
const duration = ref<number | null>(null)
const amount = ref<number | null>(null)
const foodName = ref('')
const note = ref('')
const occurredTs = ref(Date.now())
const loading = ref(false)

const occurredAt = computed(() => tsToIso(occurredTs.value))

onMounted(async () => {
  // 记录页可能是首屏（如在 /record 刷新），主动拉取宝宝，避免误判"未添加宝宝"
  if (!baby.value) {
    try {
      await babyStore.fetch()
    } catch {
      /* 失败交给 submit 时再判断 */
    }
  }
  // 默认带入上一次记录的类型与奶量
  try {
    const last = await getLastFeeding()
    if (last) {
      type.value = last.type
      if ((last.type === 'formula' || last.type === 'bottle') && last.amount_ml) {
        amount.value = last.amount_ml
      }
      if (last.type === 'breast') {
        leftDuration.value = last.left_duration_min ?? null
        rightDuration.value = last.right_duration_min ?? null
      }
    }
  } catch {
    /* 无历史记录时忽略，使用默认空值 */
  }
})

async function submit() {
  if (!baby.value) {
    // 兜底：提交前再确认一次服务端是否已有宝宝
    try {
      await babyStore.fetch()
    } catch {
      /* ignore */
    }
  }
  if (!baby.value) {
    message.warning('请先在「我的」创建宝宝')
    router.push('/baby')
    return
  }
  loading.value = true
  try {
    if (type.value === 'breast') {
      if (!leftDuration.value && !rightDuration.value) {
        message.warning('请填写母乳时长（左乳或右乳至少一项）')
        loading.value = false
        return
      }
      await createFeeding({ type: 'breast', left_duration_min: leftDuration.value, right_duration_min: rightDuration.value, note: note.value || null, occurred_at: occurredAt.value })
    } else if (type.value === 'formula') {
      if (!amount.value || amount.value <= 0) {
        message.warning('请填写奶量')
        loading.value = false
        return
      }
      await createFeeding({ type: 'formula', amount_ml: amount.value, note: note.value || null, occurred_at: occurredAt.value })
    } else if (type.value === 'bottle') {
      if (!amount.value || amount.value <= 0) {
        message.warning('请填写奶量')
        loading.value = false
        return
      }
      await createFeeding({ type: 'bottle', amount_ml: amount.value, note: note.value || null, occurred_at: occurredAt.value })
    } else if (type.value === 'food') {
      if (!foodName.value || !foodName.value.trim()) {
        message.warning('请填写辅食名称')
        loading.value = false
        return
      }
      await createFeeding({ type: 'food', food_name: foodName.value.trim(), note: note.value || null, occurred_at: occurredAt.value })
    } else if (type.value === 'sleep') {
      if (!duration.value || duration.value <= 0) {
        message.warning('请填写睡眠时长')
        loading.value = false
        return
      }
      await createSleep({ duration_min: duration.value, note: note.value || null, occurred_at: occurredAt.value })
    } else if (type.value === 'diaper') {
      await createDiaper({ type: diaperType.value, note: note.value || null, occurred_at: occurredAt.value })
    }
    message.success('已记录 🎉')
    router.replace('/')
  } catch (e: any) {
    message.error(e?.message || '保存失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.record {
  padding: 12px 16px 24px;
}
.hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.title {
  font-size: 16px;
  font-weight: 600;
}
.type-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 8px;
}
.type-btn {
  flex: none;
  border: 1px solid #e6e8ef;
  background: #fff;
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 13px;
  color: #4a4f5c;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.type-btn.active {
  background: #ff7aa2;
  color: #fff;
  border-color: #ff7aa2;
}
.ti {
  font-size: 15px;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 13px;
  color: #6b7180;
}
.req {
  color: #ff5c8a;
  margin-left: 2px;
}
.seg {
  display: flex;
  gap: 8px;
}
.seg-btn {
  flex: 1;
  border: 1px solid #e6e8ef;
  background: #fff;
  border-radius: 10px;
  padding: 10px;
  font-size: 13px;
  color: #4a4f5c;
  cursor: pointer;
}
.seg-btn.active {
  background: #fff0f5;
  border-color: #ff7aa2;
  color: #ff5c8a;
  font-weight: 600;
}
</style>
