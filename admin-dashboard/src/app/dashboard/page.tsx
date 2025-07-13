import React from 'react'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Props = {}

const page = (props: Props) => {
  return (
    <div className='p-5'>
     <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>

    <div className='font-bold my-2 text-3xl'>Dashboard</div>

    <div className='grid grid-cols-3 grid-rows-3 gap-2'>


    <Card className='p-4'>
      <CardHeader>
      <CardTitle>Average Typing Speed</CardTitle>
      </CardHeader>
      <CardContent>
          Enter your email below to login to your account
        </CardContent>
    </Card>

    <Card className='p-4'>
      <CardHeader>
      <CardTitle>Average Typing Speed</CardTitle>
      </CardHeader>
      <CardContent>
          Enter your email below to login to your account
        </CardContent>
    </Card>

    <Card className='p-4'>
      <CardHeader>
      <CardTitle>Average Typing Speed</CardTitle>
      </CardHeader>
      <CardContent>
          Enter your email below to login to your account
        </CardContent>
    </Card>

     <Card className='p-4 col-span-2 row-span-2'>
      <CardHeader>
      <CardTitle>Average Typing Speed</CardTitle>
      </CardHeader>
      <CardContent>
          Enter your email below to login to your account
        </CardContent>
    </Card>

    <Card className='p-4 col-span-1 row-span-2'>
      <CardHeader>
      <CardTitle>Average Typing Speed</CardTitle>
      </CardHeader>
      <CardContent>
          Enter your email below to login to your account
        </CardContent>
    </Card>
      </div>
    </div>
  )
}

export default page

import Link from "next/link"
