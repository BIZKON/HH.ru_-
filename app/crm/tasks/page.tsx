"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TaskList, Task } from "@/components/crm/task-list"
import { TaskForm, TaskFormData } from "@/components/crm/task-form"
import { Plus, Search, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (priorityFilter !== "all") params.set("priority", priorityFilter)
      if (typeFilter !== "all") params.set("type", typeFilter)
      if (searchQuery) params.set("search", searchQuery)

      const response = await fetch(`/api/crm/tasks?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [statusFilter, priorityFilter, typeFilter])

  const handleSearch = () => {
    fetchTasks()
  }

  const handleCreateTask = async (taskData: TaskFormData) => {
    const response = await fetch("/api/crm/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    })

    if (response.ok) {
      await fetchTasks()
      setShowTaskForm(false)
    }
  }

  const handleUpdateTask = async (taskData: TaskFormData) => {
    const response = await fetch("/api/crm/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData),
    })

    if (response.ok) {
      await fetchTasks()
      setShowTaskForm(false)
      setEditingTask(null)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту задачу?")) return

    const response = await fetch(`/api/crm/tasks?id=${taskId}`, {
      method: "DELETE",
    })

    if (response.ok) {
      await fetchTasks()
    }
  }

  const handleStatusChange = async (taskId: string, status: string) => {
    const response = await fetch("/api/crm/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: taskId, status }),
    })

    if (response.ok) {
      await fetchTasks()
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }

  const handleCloseForm = () => {
    setShowTaskForm(false)
    setEditingTask(null)
  }

  // Group tasks by status
  const pendingTasks = tasks.filter((t) => t.status === "pending")
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress")
  const completedTasks = tasks.filter((t) => t.status === "completed")
  const overdueTasks = tasks.filter(
    (t) =>
      t.dueDate &&
      new Date(t.dueDate) < new Date() &&
      t.status !== "completed"
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загрузка задач...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Задачи</h1>
          <p className="text-muted-foreground mt-1">
            Управление задачами и отслеживание прогресса
          </p>
        </div>
        <Button onClick={() => setShowTaskForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Создать задачу
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего задач
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ожидают
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              В процессе
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Просрочено
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overdueTasks.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Поиск задач..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">Ожидает</SelectItem>
                <SelectItem value="in_progress">В процессе</SelectItem>
                <SelectItem value="completed">Выполнена</SelectItem>
                <SelectItem value="cancelled">Отменена</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Приоритет" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все приоритеты</SelectItem>
                <SelectItem value="low">Низкий</SelectItem>
                <SelectItem value="medium">Средний</SelectItem>
                <SelectItem value="high">Высокий</SelectItem>
                <SelectItem value="urgent">Срочный</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Все ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Просрочено ({overdueTasks.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Ожидают ({pendingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            В процессе ({inProgressTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Выполнено ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <TaskList
            tasks={tasks}
            onEdit={handleEdit}
            onDelete={handleDeleteTask}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="overdue">
          <TaskList
            tasks={overdueTasks}
            onEdit={handleEdit}
            onDelete={handleDeleteTask}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="pending">
          <TaskList
            tasks={pendingTasks}
            onEdit={handleEdit}
            onDelete={handleDeleteTask}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="in_progress">
          <TaskList
            tasks={inProgressTasks}
            onEdit={handleEdit}
            onDelete={handleDeleteTask}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="completed">
          <TaskList
            tasks={completedTasks}
            onEdit={handleEdit}
            onDelete={handleDeleteTask}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>
      </Tabs>

      {/* Task Form Dialog */}
      <TaskForm
        open={showTaskForm}
        onClose={handleCloseForm}
        onSave={editingTask ? handleUpdateTask : handleCreateTask}
        initialData={editingTask || undefined}
      />
    </div>
  )
}
